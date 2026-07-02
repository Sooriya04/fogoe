const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const chalk = require('chalk');
const { select } = require('../prompts');
const { PLUGINS } = require('./registry');
const templates = require('./templates');

/**
 * Resolve the file content for a plugin given the project config.
 */
function resolveTemplate(pluginName, language, moduleType) {
  const tmpl = templates[pluginName];
  if (!tmpl) throw new Error(`No template found for plugin "${pluginName}"`);

  if (language === 'ts') {
    return tmpl.ts;
  }
  // JS: pick commonjs or module variant
  return moduleType === 'esm' ? tmpl.js.module : tmpl.js.commonjs;
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
 * Install npm packages.
 */
function installPackages(packages, devPackages) {
  const { getPackageManager } = require('../installer');
  const pm = getPackageManager();

  if (packages) {
    console.log(chalk.cyan(`\n  Installing ${packages} with ${pm}...`));
    if (pm === "npm") {
      execSync(`npm install --save ${packages}`, { stdio: 'inherit' });
    } else if (pm === "bun") {
      execSync(`bun add ${packages}`, { stdio: 'inherit' });
    } else if (pm === "pnpm") {
      execSync(`pnpm add ${packages}`, { stdio: 'inherit' });
    } else if (pm === "yarn") {
      execSync(`yarn add ${packages}`, { stdio: 'inherit' });
    }
  }
  if (devPackages) {
    console.log(chalk.cyan(`  Installing ${devPackages} (dev) with ${pm}...`));
    if (pm === "npm") {
      execSync(`npm install --save-dev ${devPackages}`, { stdio: 'inherit' });
    } else if (pm === "bun") {
      execSync(`bun add -d ${devPackages}`, { stdio: 'inherit' });
    } else if (pm === "pnpm") {
      execSync(`pnpm add -D ${devPackages}`, { stdio: 'inherit' });
    } else if (pm === "yarn") {
      execSync(`yarn add -D ${devPackages}`, { stdio: 'inherit' });
    }
  }
}

/**
 * Main entry point for `fogoe add [pluginName]`
 * @param {string|undefined} pluginArg - plugin name from CLI args, or undefined to prompt
 */
async function addPlugin(pluginArg) {
  // ── 1. Validate we are inside a Fogoe project ──────────────────────────────
  const configPath = path.join(process.cwd(), 'fogoe.config.json');
  if (!fs.existsSync(configPath)) {
    console.error(chalk.red('\n  ✗ fogoe.config.json not found.'));
    console.error(chalk.yellow('    Run fogoe inside a Fogoe project directory.\n'));
    process.exit(1);
  }

  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  const { language = 'js', type = 'cjs', arch = 'minimal' } = config.defaults || {};

  // ── 2. Determine which plugin to add ───────────────────────────────────────
  let pluginName = pluginArg;

  if (!pluginName) {
    // Show interactive select
    const choices = Object.entries(PLUGINS).map(([name, meta]) => `${name} — ${meta.description}`);
    const chosen = await select('Select a plugin to add', choices);
    if (!chosen) process.exit(0);
    pluginName = chosen.split(' — ')[0];
  }

  const plugin = PLUGINS[pluginName];
  if (!plugin) {
    console.error(chalk.red(`\n  ✗ Unknown plugin: "${pluginName}"`));
    console.error(chalk.yellow(`    Available plugins: ${Object.keys(PLUGINS).join(', ')}\n`));
    process.exit(1);
  }

  console.log(chalk.cyan(`\n  Adding ${pluginName}...\n`));

  // ── 3. Ensure output directory exists ─────────────────────────────────────
  const ext = language === 'ts' ? 'ts' : 'js';
  const outputDir = path.join(process.cwd(), plugin.outputDir);
  fs.mkdirSync(outputDir, { recursive: true });

  // ── 4. Write scaffolded file ───────────────────────────────────────────────
  const outputPath = path.join(outputDir, `${plugin.outputFile}.${ext}`);

  if (fs.existsSync(outputPath)) {
    console.log(chalk.yellow(`  ⚠ ${plugin.outputDir}/${plugin.outputFile}.${ext} already exists — skipping file write.`));
  } else {
    const content = resolveTemplate(pluginName, language, type);
    fs.writeFileSync(outputPath, content);
    console.log(chalk.green(`  ✓ Created ${plugin.outputDir}/${plugin.outputFile}.${ext}`));
  }

  // ── 5. Install packages ────────────────────────────────────────────────────
  // Skip dev type packages when project is JS (no TypeScript)
  const devPkgs = language === 'ts' ? plugin.devPackages : '';
  installPackages(plugin.packages, devPkgs);

  // ── 6. Append env vars ─────────────────────────────────────────────────────
  appendEnvVars(plugin.envVars);

  // ── 7. Update fogoe.config.json addons list ────────────────────────────────
  if (!config.addons) config.addons = [];
  if (!config.addons.includes(pluginName)) {
    config.addons.push(pluginName);
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    console.log(chalk.green(`  ✓ fogoe.config.json updated (addons: [${config.addons.join(', ')}])`));
  }

  // ── 8. Done ────────────────────────────────────────────────────────────────
  console.log(chalk.green(`\n  ✓ ${pluginName} added successfully!\n`));

  // Plugin-specific next steps
  const hints = {
    redis: `  ${chalk.cyan('Next:')} Update REDIS_URL in .env, then import the client:\n    ${chalk.gray(`const client = require('./${plugin.outputDir}/${plugin.outputFile}')`)}`,
    zod: `  ${chalk.cyan('Next:')} Import validate() in your routes:\n    ${chalk.gray(`const { validate, z } = require('./${plugin.outputDir}/${plugin.outputFile}')`)}`,
    mailer: `  ${chalk.cyan('Next:')} Fill in SMTP_USER and SMTP_PASS in .env, then:\n    ${chalk.gray(`const { sendMail } = require('./${plugin.outputDir}/${plugin.outputFile}')`)}`,
    stripe: `  ${chalk.cyan('Next:')} Add your STRIPE_SECRET_KEY in .env, then:\n    ${chalk.gray(`const stripe = require('./${plugin.outputDir}/${plugin.outputFile}')`)}`,
    ratelimit: `  ${chalk.cyan('Next:')} Apply the limiter in your app.js:\n    ${chalk.gray(`const limiter = require('./${plugin.outputDir}/${plugin.outputFile}')\n    app.use(limiter)`)}`,
    swagger: `  ${chalk.cyan('Next:')} Mount the docs route in app.js:\n    ${chalk.gray(`const { swaggerUi, spec } = require('./${plugin.outputDir}/${plugin.outputFile}')\n    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(spec))`)}`,
    socket: `  ${chalk.cyan('Next:')} Wrap your server in server.js:\n    ${chalk.gray(`const http = require('http')\n    const { setupSocket } = require('./${plugin.outputDir}/${plugin.outputFile}')\n    const server = http.createServer(app)\n    setupSocket(server)\n    server.listen(PORT)`)}`,
  };

  if (hints[pluginName]) console.log(hints[pluginName] + '\n');
}

module.exports = { addPlugin };
