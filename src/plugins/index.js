const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const chalk = require('chalk');
const { select } = require('../prompts');
const { PLUGINS, getPluginConfig } = require('./registry');
const templates = require('./templates');
const { installPackageList, uninstallPackageList } = require('../installer');

/**
 * Detect runtime framework from fogoe.config.json or package.json dependencies.
 */
function detectRuntime(config) {
  if (config?.defaults?.runtime) return config.defaults.runtime.toLowerCase();
  if (config?.defaults?.framework) return config.defaults.framework.toLowerCase();

  const pkgPath = path.join(process.cwd(), 'package.json');
  if (fs.existsSync(pkgPath)) {
    try {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
      const deps = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) };
      if (deps['fastify']) return 'fastify';
      if (deps['hono'] || deps['@hono/node-server']) return 'hono';
      if (deps['koa']) return 'koa';
      if (deps['express']) return 'express';
    } catch {}
  }

  return 'express';
}

/**
 * Validate npm package name syntax before querying the network.
 */
function isValidNpmPackageName(name) {
  if (!name || typeof name !== 'string' || name.length > 214) return false;
  // Scoped or non-scoped valid npm package name regex
  return /^(@[a-z0-9-~][a-z0-9-._~]*\/)?[a-z0-9-~][a-z0-9-._~]*$/.test(name);
}

const isWindows = process.platform === 'win32';

/**
 * Check if a package name exists on npm registry.
 * Uses execFileSync with discrete arguments to prevent shell injection.
 */
function checkNpmPackageExists(packageName) {
  if (!isValidNpmPackageName(packageName)) {
    return false;
  }
  try {
    execFileSync('npm', ['view', packageName, 'version'], {
      stdio: ['pipe', 'pipe', 'ignore'],
      encoding: 'utf8',
      shell: isWindows,
    });
    return true;
  } catch {
    return false;
  }
}

/**
 * Check if @types package exists on npm and is needed.
 * Uses execFileSync with discrete arguments to prevent shell injection.
 */
function resolveTypesPackage(packageName) {
  if (!isValidNpmPackageName(packageName)) {
    return null;
  }
  try {
    // Check if main package already bundles types
    const typings = execFileSync('npm', ['view', packageName, 'typings'], {
      stdio: ['pipe', 'pipe', 'ignore'],
      encoding: 'utf8',
      shell: isWindows,
    }).trim();
    const types = execFileSync('npm', ['view', packageName, 'types'], {
      stdio: ['pipe', 'pipe', 'ignore'],
      encoding: 'utf8',
      shell: isWindows,
    }).trim();

    if (typings || types) {
      return null; // Already includes bundled types
    }

    // Strip scope if scoped (e.g. @foo/bar -> foo__bar)
    const typesName = packageName.startsWith('@')
      ? `@types/${packageName.slice(1).replace('/', '__')}`
      : `@types/${packageName}`;

    const exists = checkNpmPackageExists(typesName);
    return exists ? typesName : null;
  } catch {
    return null;
  }
}

/**
 * Install npm packages.
 */
function installPackages(packages, devPackages, preferredPm = null, silent = false) {
  installPackageList({ packages, devPackages, pm: preferredPm, silent });
}

/**
 * Main entry point for `fogoe add [pluginName]`
 * Supports both pre-configured Fogoe plugins and any package from the npm registry.
 *
 * @param {string|undefined} pluginArg - plugin or npm package name
 * @param {object} options - { dev: boolean, json: boolean, pm: string }
 */
async function addPlugin(pluginArg, options = {}) {
  const { dev = false, json = false, pm = null } = options;

  // ── 1. Validate we are inside a Fogoe project ──────────────────────────────
  const configPath = path.join(process.cwd(), 'fogoe.config.json');
  if (!fs.existsSync(configPath)) {
    if (json) {
      console.log(JSON.stringify({ success: false, error: 'fogoe.config.json not found' }));
      process.exit(1);
    }
    console.error(chalk.red('\n  ✗ fogoe.config.json not found.'));
    console.error(chalk.yellow('    Run fogoe inside a Fogoe project directory.\n'));
    process.exit(1);
  }

  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  const { language = 'js', type = 'cjs', arch = 'minimal' } = config.defaults || {};
  const runtime = detectRuntime(config);

  // ── 2. Determine which plugin to add ───────────────────────────────────────
  let pluginName = pluginArg;

  if (!pluginName) {
    if (json) {
      console.log(JSON.stringify({ success: false, error: 'Package name required in non-interactive/json mode' }));
      process.exit(1);
    }
    // Show interactive select
    const choices = Object.entries(PLUGINS).map(([name, meta]) => `${name} — ${meta.description}`);
    const chosen = await select('Select a plugin to add', choices);
    if (!chosen) process.exit(0);
    pluginName = chosen.split(' — ')[0];
  }

  const plugin = getPluginConfig(pluginName, runtime);

  // ── Case A: Arbitrary npm package (not in pre-configured PLUGINS) ───────────
  if (!plugin) {
    // Check if the package exists on npm
    const exists = checkNpmPackageExists(pluginName);
    if (!exists) {
      if (json) {
        console.log(JSON.stringify({ success: false, error: `Package "${pluginName}" not found on npm registry` }));
        process.exit(1);
      }
      console.error(chalk.red(`\n  ✗ Package "${pluginName}" not found on npm registry.`));
      console.error(chalk.yellow(`    Available pre-configured plugins: ${Object.keys(PLUGINS).join(', ')}\n`));
      process.exit(1);
    }

    if (!json) {
      console.log(chalk.cyan(`\n  Adding package ${chalk.bold(pluginName)} from npm...`));
    }

    let mainPkgs = dev ? '' : pluginName;
    let devPkgs = dev ? pluginName : '';

    // If project is TypeScript and user installed as regular dependency, auto-detect @types
    if (language === 'ts' && !dev) {
      const typesPkg = resolveTypesPackage(pluginName);
      if (typesPkg) {
        if (!json) console.log(chalk.gray(`  Found TypeScript definitions: ${typesPkg}`));
        devPkgs = devPkgs ? `${devPkgs} ${typesPkg}` : typesPkg;
      }
    }

    installPackages(mainPkgs, devPkgs, pm, json);

    if (json) {
      console.log(JSON.stringify({
        success: true,
        package: pluginName,
        isDev: dev,
        installedTypes: devPkgs || null,
      }));
      return;
    }

    console.log(chalk.green(`\n  ✓ Successfully installed ${pluginName}!\n`));
    return;
  }

  if (plugin.isSpecial) {
    if (pluginName === 'compose' || pluginName === 'docker-compose') {
      const { setupCompose } = require('../ci/compose');
      await setupCompose({ targetDir: process.cwd() });
      return;
    }
    const { setupCiCd } = require('../ci');
    await setupCiCd({
      ci: pluginName === 'ci',
      docker: pluginName === 'docker',
    });
    return;
  }

  if (!json) console.log(chalk.cyan(`\n  Adding ${pluginName} (${runtime})...\n`));

  // ── 3. Ensure output directory exists ─────────────────────────────────────
  const ext = language === 'ts' ? 'ts' : 'js';
  const outputDir = path.join(process.cwd(), plugin.outputDir);
  fs.mkdirSync(outputDir, { recursive: true });

  // ── 4. Write scaffolded file ───────────────────────────────────────────────
  const outputPath = path.join(outputDir, `${plugin.outputFile}.${ext}`);

  if (fs.existsSync(outputPath)) {
    if (!json) console.log(chalk.yellow(`  ⚠ ${plugin.outputDir}/${plugin.outputFile}.${ext} already exists — skipping file write.`));
  } else {
    const content = resolveTemplate(pluginName, language, type, runtime);
    fs.writeFileSync(outputPath, content);
    if (!json) console.log(chalk.green(`  ✓ Created ${plugin.outputDir}/${plugin.outputFile}.${ext}`));
  }

  // ── 5. Install packages ────────────────────────────────────────────────────
  // Skip dev type packages when project is JS (no TypeScript)
  const devPkgs = language === 'ts' ? (plugin.devPackages || '') : '';
  installPackages(plugin.packages, devPkgs, pm, json);

  // ── 6. Append env vars ─────────────────────────────────────────────────────
  appendEnvVars(plugin.envVars);

  // ── 7. Update fogoe.config.json addons list ────────────────────────────────
  if (!config.addons) config.addons = [];
  if (!config.addons.includes(pluginName)) {
    config.addons.push(pluginName);
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    if (!json) console.log(chalk.green(`  ✓ fogoe.config.json updated (addons: [${config.addons.join(', ')}])`));
  }

  // ── 8. Done ────────────────────────────────────────────────────────────────
  if (json) {
    console.log(JSON.stringify({
      success: true,
      plugin: pluginName,
      runtime,
      packages: plugin.packages,
      devPackages: devPkgs || null,
      outputFile: `${plugin.outputDir}/${plugin.outputFile}.${ext}`,
    }));
    return;
  }

  console.log(chalk.green(`\n  ✓ ${pluginName} added successfully!\n`));

  // Plugin-specific next steps
  const hints = {
    redis: `  ${chalk.cyan('Next:')} Update REDIS_URL in .env, then import the client:\n    ${chalk.gray(`const client = require('./${plugin.outputDir}/${plugin.outputFile}')`)}`,
    zod: getZodHint(runtime, plugin),
    mailer: `  ${chalk.cyan('Next:')} Fill in SMTP_USER and SMTP_PASS in .env, then:\n    ${chalk.gray(`const { sendMail } = require('./${plugin.outputDir}/${plugin.outputFile}')`)}`,
    stripe: `  ${chalk.cyan('Next:')} Add your STRIPE_SECRET_KEY in .env, then:\n    ${chalk.gray(`const stripe = require('./${plugin.outputDir}/${plugin.outputFile}')`)}`,
    ratelimit: getRateLimitHint(runtime, plugin),
    swagger: getSwaggerHint(runtime, plugin),
    socket: `  ${chalk.cyan('Next:')} Wrap your server in server.js:\n    ${chalk.gray(`const http = require('http')\n    const { setupSocket } = require('./${plugin.outputDir}/${plugin.outputFile}')\n    const server = http.createServer(app)\n    setupSocket(server)\n    server.listen(PORT)`)}`,
    queue: `  ${chalk.cyan('Next:')} Ensure Redis is running (or run fogoe compose up -d), then enqueue jobs:\n    ${chalk.gray(`const { addJob } = require('./${plugin.outputDir}/${plugin.outputFile}')\n    await addJob('send-email', { to: 'user@example.com' })`)}`,
    bullmq: `  ${chalk.cyan('Next:')} Ensure Redis is running (or run fogoe compose up -d), then enqueue jobs:\n    ${chalk.gray(`const { addJob } = require('./${plugin.outputDir}/${plugin.outputFile}')\n    await addJob('send-email', { to: 'user@example.com' })`)}`,
  };

  if (hints[pluginName]) console.log(hints[pluginName] + '\n');
}

function getRateLimitHint(runtime, plugin) {
  const relPath = `./${plugin.outputDir}/${plugin.outputFile}`;
  if (runtime === 'fastify') {
    return `  ${chalk.cyan('Next:')} Register the rate limiter in your app / server:\n    ${chalk.gray(`const setupRateLimit = require('${relPath}')\n    await setupRateLimit(fastify)`)}`;
  }
  if (runtime === 'hono') {
    return `  ${chalk.cyan('Next:')} Apply the rate limiter in your app:\n    ${chalk.gray(`const limiter = require('${relPath}')\n    app.use(limiter)`)}`;
  }
  if (runtime === 'koa') {
    return `  ${chalk.cyan('Next:')} Apply the rate limiter in your app:\n    ${chalk.gray(`const limiter = require('${relPath}')\n    app.use(limiter)`)}`;
  }
  return `  ${chalk.cyan('Next:')} Apply the limiter in your app.js:\n    ${chalk.gray(`const limiter = require('${relPath}')\n    app.use(limiter)`)}`;
}

function getSwaggerHint(runtime, plugin) {
  const relPath = `./${plugin.outputDir}/${plugin.outputFile}`;
  if (runtime === 'fastify') {
    return `  ${chalk.cyan('Next:')} Register Swagger in your app / server:\n    ${chalk.gray(`const setupSwagger = require('${relPath}')\n    await setupSwagger(fastify)\n    // API docs available at http://localhost:<port>/api-docs`)}`;
  }
  if (runtime === 'hono') {
    return `  ${chalk.cyan('Next:')} Mount the docs route in your app:\n    ${chalk.gray(`const setupSwagger = require('${relPath}')\n    setupSwagger(app)\n    // API docs available at http://localhost:<port>/api-docs`)}`;
  }
  if (runtime === 'koa') {
    return `  ${chalk.cyan('Next:')} Mount the docs middleware in your app:\n    ${chalk.gray(`const { swaggerMiddleware } = require('${relPath}')\n    app.use(swaggerMiddleware)\n    // API docs available at http://localhost:<port>/api-docs`)}`;
  }
  return `  ${chalk.cyan('Next:')} Mount the docs route in app.js:\n    ${chalk.gray(`const { swaggerUi, spec } = require('${relPath}')\n    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(spec))`)}`;
}

function getZodHint(runtime, plugin) {
  const relPath = `./${plugin.outputDir}/${plugin.outputFile}`;
  return `  ${chalk.cyan('Next:')} Import validate() in your routes / handlers:\n    ${chalk.gray(`const { validate, z } = require('${relPath}')`)}`;
}

/**
 * Resolve the file content for a plugin given the project config and runtime.
 */
function resolveTemplate(pluginName, language, moduleType, runtime = 'express') {
  const tmpl = templates[pluginName];
  if (!tmpl) throw new Error(`No template found for plugin "${pluginName}"`);

  const normRuntime = (runtime || 'express').toLowerCase();
  const stack = tmpl.stacks?.[normRuntime] || tmpl.stacks?.express || tmpl;

  if (language === 'ts') {
    return stack.ts;
  }
  // JS: pick commonjs or module variant
  return moduleType === 'esm' ? stack.js.module : stack.js.commonjs;
}

/**
 * Append env vars to .env without duplicating existing keys.
 */
function appendEnvVars(envVars) {
  const envPath = path.join(process.cwd(), '.env');
  if (!envVars) return;

  if (!fs.existsSync(envPath)) {
    fs.writeFileSync(envPath, envVars + '\n');
    console.log(chalk.green('  ✓ .env created with required variables'));
    return;
  }

  const current = fs.readFileSync(envPath, 'utf8');
  const toAppend = envVars
    .split('\n')
    .filter((line) => {
      const key = line.split('=')[0].trim();
      return key && !current.includes(key + '=');
    })
    .join('\n');

  if (toAppend) {
    fs.appendFileSync(envPath, '\n' + toAppend + '\n');
    console.log(chalk.green('  ✓ .env updated with required variables'));
  }
}

/**
 * Uninstall npm packages.
 */
function uninstallPackages(packages, preferredPm = null, silent = false) {
  uninstallPackageList({ packages, pm: preferredPm, silent });
}

/**
 * Main entry point for `fogoe remove [packageName]` (or `fogoe rm`)
 * Supports removing pre-configured plugins or any arbitrary npm package,
 * including auto-cleanup of companion @types packages and fogoe.config.json addons.
 *
 * @param {string|undefined} packageArg - package name
 * @param {object} options - { json: boolean, pm: string }
 */
async function removePlugin(packageArg, options = {}) {
  const { json = false, pm = null } = options;

  // ── 1. Validate we are inside a Fogoe project ──────────────────────────────
  const configPath = path.join(process.cwd(), 'fogoe.config.json');
  if (!fs.existsSync(configPath)) {
    if (json) {
      console.log(JSON.stringify({ success: false, error: 'fogoe.config.json not found' }));
      process.exit(1);
    }
    console.error(chalk.red('\n  ✗ fogoe.config.json not found.'));
    console.error(chalk.yellow('    Run fogoe inside a Fogoe project directory.\n'));
    process.exit(1);
  }

  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  const { language = 'js' } = config.defaults || {};

  const pkgJsonPath = path.join(process.cwd(), 'package.json');
  const pkgJson = fs.existsSync(pkgJsonPath) ? JSON.parse(fs.readFileSync(pkgJsonPath, 'utf8')) : { dependencies: {}, devDependencies: {} };
  const deps = pkgJson.dependencies || {};
  const devDeps = pkgJson.devDependencies || {};

  // ── 2. Determine package to remove ─────────────────────────────────────────
  let targetPackage = packageArg;
  if (!targetPackage) {
    if (json) {
      console.log(JSON.stringify({ success: false, error: 'Package name required in non-interactive/json mode' }));
      process.exit(1);
    }

    const installed = Array.from(new Set([
      ...(config.addons || []),
      ...Object.keys(deps),
      ...Object.keys(devDeps),
    ])).sort();

    if (installed.length === 0) {
      if (json) {
        console.log(JSON.stringify({ success: false, error: 'No packages found to remove' }));
        process.exit(0);
      }
      console.log(chalk.yellow('\n  No packages found to remove.\n'));
      return;
    }

    const chosen = await select('Select a package or addon to remove', installed);
    if (!chosen) process.exit(0);
    targetPackage = chosen;
  }

  // ── 3. Resolve packages and companion @types ────────────────────────────────
  const packagesToUninstall = [];
  const plugin = PLUGINS[targetPackage];

  if (plugin) {
    if (plugin.stacks) {
      for (const stack of Object.values(plugin.stacks)) {
        if (stack.packages) packagesToUninstall.push(...stack.packages.split(' ').filter(Boolean));
        if (stack.devPackages) packagesToUninstall.push(...stack.devPackages.split(' ').filter(Boolean));
      }
    }
    if (plugin.packages) {
      packagesToUninstall.push(...plugin.packages.split(' ').filter(Boolean));
    }
    if (plugin.devPackages) {
      packagesToUninstall.push(...plugin.devPackages.split(' ').filter(Boolean));
    }
  } else {
    packagesToUninstall.push(targetPackage);
    // Check if companion @types exists in devDependencies
    const typesName = targetPackage.startsWith('@')
      ? `@types/${targetPackage.slice(1).replace('/', '__')}`
      : `@types/${targetPackage}`;

    if (devDeps[typesName] || deps[typesName]) {
      packagesToUninstall.push(typesName);
    }
  }

  // Deduplicate candidates
  const uniqueCandidates = Array.from(new Set(packagesToUninstall));
  // Only attempt to uninstall what is actually listed in package.json
  const toRemove = uniqueCandidates.filter((pkg) => deps[pkg] || devDeps[pkg]);
  const removeList = toRemove.length > 0 ? toRemove : uniqueCandidates;

  if (removeList.length > 0) {
    uninstallPackages(removeList.join(' '), pm, json);
  }

  // ── 4. Clean up fogoe.config.json addons ───────────────────────────────────
  let configUpdated = false;
  if (config.addons && config.addons.includes(targetPackage)) {
    config.addons = config.addons.filter((a) => a !== targetPackage);
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    configUpdated = true;
  }

  if (json) {
    console.log(JSON.stringify({
      success: true,
      package: targetPackage,
      removedPackages: removeList,
      configUpdated,
    }));
    return;
  }

  if (configUpdated) {
    console.log(chalk.green(`  ✓ fogoe.config.json updated (removed ${targetPackage} from addons)`));
  }
  console.log(chalk.green(`\n  ✓ Successfully removed ${chalk.bold(targetPackage)}!\n`));
}

module.exports = {
  addPlugin,
  removePlugin,
  uninstallPackages,
  checkNpmPackageExists,
  resolveTypesPackage,
  resolveTemplate,
  detectRuntime,
};
