const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const chalk = require('chalk');
const { confirm, intro, outro, note } = require('../prompts');
const { getPackageManager } = require('../installer');
const { setupGitignore } = require('../github/gitignore');
const { buildTsConfig } = require('../tsconfig');

/**
 * Parse a simple .env file into key-value dictionary without external dependencies
 */
function parseEnvFile(content) {
  const result = {};
  if (!content) return result;
  
  const lines = content.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx !== -1) {
      const key = trimmed.slice(0, eqIdx).trim();
      const val = trimmed.slice(eqIdx + 1).trim();
      result[key] = val;
    }
  }
  return result;
}

/**
 * Inspect project and compile complete diagnostics report
 * @param {string} targetDir
 * @param {Object} options
 * @returns {Object} Diagnostic report
 */
function diagnoseProject(targetDir = process.cwd(), options = {}) {
  const checks = [];
  const fixPlan = [];
  let config = null;
  let pkg = null;

  const configPath = path.join(targetDir, 'fogoe.config.json');
  const pkgPath = path.join(targetDir, 'package.json');
  const gitignorePath = path.join(targetDir, '.gitignore');
  const envPath = path.join(targetDir, '.env');
  const nodeModulesPath = path.join(targetDir, 'node_modules');
  const tsconfigPath = path.join(targetDir, 'tsconfig.json');

  // ── 1. Check fogoe.config.json ────────────────────────────────────────────
  if (!fs.existsSync(configPath)) {
    checks.push({
      id: 'config_missing',
      category: 'config',
      severity: 'error',
      status: 'fail',
      title: 'Configuration File',
      message: 'fogoe.config.json was not found in project root.',
      fixable: false,
    });
  } else {
    try {
      config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      checks.push({
        id: 'config_valid',
        category: 'config',
        severity: 'info',
        status: 'pass',
        title: 'Configuration File',
        message: 'fogoe.config.json is valid and readable.',
        fixable: false,
      });
    } catch (err) {
      checks.push({
        id: 'config_syntax_error',
        category: 'config',
        severity: 'error',
        status: 'fail',
        title: 'Configuration Syntax',
        message: `fogoe.config.json contains syntax errors: ${err.message}`,
        fixable: false,
      });
    }
  }

  // ── 2. Check package.json ─────────────────────────────────────────────────
  if (!fs.existsSync(pkgPath)) {
    checks.push({
      id: 'package_missing',
      category: 'config',
      severity: 'error',
      status: 'fail',
      title: 'package.json File',
      message: 'package.json was not found in project root.',
      fixable: false,
    });
  } else {
    try {
      pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
      checks.push({
        id: 'package_valid',
        category: 'config',
        severity: 'info',
        status: 'pass',
        title: 'package.json File',
        message: 'package.json is valid and readable.',
        fixable: false,
      });
    } catch (err) {
      checks.push({
        id: 'package_syntax_error',
        category: 'config',
        severity: 'error',
        status: 'fail',
        title: 'package.json Syntax',
        message: `package.json contains syntax errors: ${err.message}`,
        fixable: false,
      });
    }
  }

  const defaults = config?.defaults || {};
  const isTs = defaults.language === 'ts' || defaults.language === 'typescript' || Boolean(pkg?.devDependencies?.typescript);
  const runtime = (defaults.runtime || defaults.framework || '').toLowerCase();
  const db = (defaults.database || '').toLowerCase();
  const auth = (defaults.auth || '').toLowerCase();

  // ── 3. Framework & Runtime Dependencies ───────────────────────────────────
  if (pkg && runtime) {
    const deps = pkg.dependencies || {};
    const devDeps = pkg.devDependencies || {};
    const hasFramework = Boolean(deps[runtime] || devDeps[runtime]);

    if (!hasFramework && ['express', 'fastify', 'hono', 'koa'].includes(runtime)) {
      checks.push({
        id: 'dep_framework_missing',
        category: 'dependencies',
        severity: 'error',
        status: 'fail',
        title: 'Runtime Framework Package',
        message: `Required runtime package "${runtime}" is missing from dependencies.`,
        fixable: true,
      });
      fixPlan.push({
        id: 'fix_dep_framework',
        category: 'dependencies',
        description: `Install missing core framework package "${runtime}"`,
        details: `Adds "${runtime}" to dependencies in package.json`,
        apply: () => {
          const freshPkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
          freshPkg.dependencies = freshPkg.dependencies || {};
          freshPkg.dependencies[runtime] = 'latest';
          fs.writeFileSync(pkgPath, JSON.stringify(freshPkg, null, 2) + '\n', 'utf8');
        },
      });
    } else {
      checks.push({
        id: 'dep_framework_valid',
        category: 'dependencies',
        severity: 'info',
        status: 'pass',
        title: 'Runtime Framework Package',
        message: `Core framework "${runtime}" is correctly listed in dependencies.`,
        fixable: false,
      });
    }
  }

  // ── 4. Recommended npm Scripts ────────────────────────────────────────────
  if (pkg) {
    const scripts = pkg.scripts || {};
    const missingScripts = [];
    if (!scripts.dev) missingScripts.push('dev');
    if (!scripts.start) missingScripts.push('start');
    if (isTs && !scripts.build) missingScripts.push('build');

    if (missingScripts.length > 0) {
      checks.push({
        id: 'scripts_missing',
        category: 'scripts',
        severity: 'warning',
        status: 'warn',
        title: 'npm Scripts',
        message: `Missing standard lifecycle scripts in package.json: ${missingScripts.map(s => `"${s}"`).join(', ')}`,
        fixable: true,
      });

      fixPlan.push({
        id: 'fix_scripts',
        category: 'scripts',
        description: `Add missing standard lifecycle scripts (${missingScripts.join(', ')}) to package.json`,
        details: `Populates default run scripts for ${isTs ? 'TypeScript' : 'JavaScript'} backend execution.`,
        apply: () => {
          const freshPkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
          freshPkg.scripts = freshPkg.scripts || {};
          const ext = isTs ? 'ts' : 'js';
          if (!freshPkg.scripts.dev) {
            freshPkg.scripts.dev = isTs ? `tsx watch src/server.${ext}` : `nodemon src/server.${ext}`;
          }
          if (!freshPkg.scripts.start) {
            freshPkg.scripts.start = isTs ? `tsx src/server.${ext}` : `node src/server.${ext}`;
          }
          if (isTs && !freshPkg.scripts.build) {
            freshPkg.scripts.build = 'tsc';
          }
          fs.writeFileSync(pkgPath, JSON.stringify(freshPkg, null, 2) + '\n', 'utf8');
        },
      });
    } else {
      checks.push({
        id: 'scripts_valid',
        category: 'scripts',
        severity: 'info',
        status: 'pass',
        title: 'npm Scripts',
        message: 'All essential lifecycle scripts (dev, start, build) are present.',
        fixable: false,
      });
    }
  }

  // ── 5. Security & .gitignore ──────────────────────────────────────────────
  if (!fs.existsSync(gitignorePath)) {
    checks.push({
      id: 'gitignore_missing',
      category: 'security',
      severity: 'error',
      status: 'fail',
      title: '.gitignore File',
      message: '.gitignore is missing. Sensitive credentials and dependencies risk being committed.',
      fixable: true,
    });

    fixPlan.push({
      id: 'fix_create_gitignore',
      category: 'security',
      description: 'Create stack-aware .gitignore protecting .env, credentials, and node_modules/',
      details: 'Generates standard ignore rules tailored for your database, runtime, and build artifacts.',
      apply: () => {
        setupGitignore(defaults, targetDir);
      },
    });
  } else {
    const gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');
    const missingRules = [];

    // Critical security check: .env MUST be ignored
    if (!gitignoreContent.includes('.env')) {
      missingRules.push('.env');
      checks.push({
        id: 'gitignore_env_unprotected',
        category: 'security',
        severity: 'error',
        status: 'fail',
        title: 'Unprotected Environment Secrets',
        message: '.env is not ignored in .gitignore! Secrets risk leaking into Git history.',
        fixable: true,
      });
    }

    if (!gitignoreContent.includes('node_modules')) {
      missingRules.push('node_modules/');
      checks.push({
        id: 'gitignore_node_modules_missing',
        category: 'security',
        severity: 'warning',
        status: 'warn',
        title: 'Unignored Dependencies',
        message: 'node_modules/ is not ignored in .gitignore.',
        fixable: true,
      });
    }

    if (isTs && !gitignoreContent.includes('dist')) {
      missingRules.push('dist/');
      checks.push({
        id: 'gitignore_dist_missing',
        category: 'security',
        severity: 'warning',
        status: 'warn',
        title: 'Unignored Build Output',
        message: 'dist/ build artifacts directory is not ignored in .gitignore.',
        fixable: true,
      });
    }

    if (missingRules.length > 0) {
      fixPlan.push({
        id: 'fix_update_gitignore',
        category: 'security',
        description: `Append missing security rules to .gitignore: ${missingRules.join(', ')}`,
        details: 'Ensures credentials, node_modules, and build outputs are not committed.',
        apply: () => {
          setupGitignore(defaults, targetDir);
        },
      });
    } else {
      checks.push({
        id: 'gitignore_secure',
        category: 'security',
        severity: 'info',
        status: 'pass',
        title: 'Git Security (.gitignore)',
        message: '.gitignore protects .env secrets, dependencies, and build outputs.',
        fixable: false,
      });
    }
  }

  // ── 6. Environment Configuration & Secret Safety ──────────────────────────
  if (!fs.existsSync(envPath)) {
    checks.push({
      id: 'env_missing',
      category: 'environment',
      severity: 'warning',
      status: 'warn',
      title: 'Environment File (.env)',
      message: '.env file not found. Application may fail to boot without runtime configurations.',
      fixable: true,
    });

    fixPlan.push({
      id: 'fix_create_env',
      category: 'environment',
      description: 'Create template .env file with necessary default variables',
      details: 'Generates .env with PORT, safe dev secrets, and database connection strings.',
      apply: () => {
        const envLines = ['# Fogoe Environment Configuration', 'PORT=3000'];
        if (db === 'mongodb') {
          envLines.push('DATABASE_URL=mongodb://localhost:27017/app_dev');
        } else if (db === 'postgresql' || db === 'postgres') {
          envLines.push('DATABASE_URL=postgresql://postgres:postgres@localhost:5432/app_dev');
        } else if (db === 'mysql') {
          envLines.push('DATABASE_URL=mysql://root:root@localhost:3306/app_dev');
        }
        if (auth === 'jwt') {
          envLines.push(`JWT_SECRET=dev_secret_${Math.random().toString(36).substring(2, 12)}`);
        }
        fs.writeFileSync(envPath, envLines.join('\n') + '\n', 'utf8');
      },
    });
  } else {
    const envRaw = fs.readFileSync(envPath, 'utf8');
    const envMap = parseEnvFile(envRaw);
    const missingEnvKeys = [];

    if (!('PORT' in envMap)) {
      missingEnvKeys.push({ key: 'PORT', defaultVal: '3000' });
    }

    if (['mongodb', 'postgresql', 'postgres', 'mysql'].includes(db)) {
      if (!('DATABASE_URL' in envMap)) {
        let defaultDbUrl = 'postgresql://postgres:postgres@localhost:5432/app_dev';
        if (db === 'mongodb') defaultDbUrl = 'mongodb://localhost:27017/app_dev';
        if (db === 'mysql') defaultDbUrl = 'mysql://root:root@localhost:3306/app_dev';
        missingEnvKeys.push({ key: 'DATABASE_URL', defaultVal: defaultDbUrl });
      }
    }

    if (auth === 'jwt') {
      if (!('JWT_SECRET' in envMap)) {
        missingEnvKeys.push({
          key: 'JWT_SECRET',
          defaultVal: `dev_secret_${Math.random().toString(36).substring(2, 12)}`,
        });
      } else {
        const secretVal = envMap.JWT_SECRET.toLowerCase();
        const placeholderSecrets = ['secret', 'your-secret-key', 'changeme', 'temp', 'test', 'password'];
        if (placeholderSecrets.includes(secretVal)) {
          checks.push({
            id: 'env_jwt_secret_insecure',
            category: 'environment',
            severity: 'warning',
            status: 'warn',
            title: 'Default Placeholder JWT Secret',
            message: `JWT_SECRET is currently set to a predictable placeholder ("${envMap.JWT_SECRET}"). Update before production.`,
            fixable: false, // Do NOT overwrite existing secrets
          });
        }
      }
    }

    if (missingEnvKeys.length > 0) {
      checks.push({
        id: 'env_keys_missing',
        category: 'environment',
        severity: 'warning',
        status: 'warn',
        title: 'Missing Environment Keys',
        message: `.env is missing expected keys: ${missingEnvKeys.map(k => k.key).join(', ')}`,
        fixable: true,
      });

      fixPlan.push({
        id: 'fix_append_env',
        category: 'environment',
        description: `Append missing keys to .env (${missingEnvKeys.map(k => k.key).join(', ')}) without modifying existing secrets`,
        details: 'Safely appends only the absent variables to .env; existing secret values remain untouched.',
        apply: () => {
          const current = fs.readFileSync(envPath, 'utf8');
          const toAppend = missingEnvKeys
            .filter(({ key }) => !current.includes(`${key}=`))
            .map(({ key, defaultVal }) => `${key}=${defaultVal}`)
            .join('\n');
          if (toAppend) {
            const separator = current.endsWith('\n') ? '' : '\n';
            fs.appendFileSync(envPath, `${separator}\n# Added by Fogoe Doctor\n${toAppend}\n`, 'utf8');
          }
        },
      });
    } else {
      checks.push({
        id: 'env_valid',
        category: 'environment',
        severity: 'info',
        status: 'pass',
        title: 'Environment Configuration (.env)',
        message: 'All expected environment keys are configured in .env.',
        fixable: false,
      });
    }
  }

  // ── 7. Dependency Installation & Lockfile ─────────────────────────────────
  let hasNodeModules = fs.existsSync(nodeModulesPath);
  if (hasNodeModules) {
    try {
      hasNodeModules = fs.readdirSync(nodeModulesPath).length > 0;
    } catch {
      hasNodeModules = false;
    }
  }

  const pm = getPackageManager(options.pm);

  if (!hasNodeModules) {
    checks.push({
      id: 'deps_missing',
      category: 'dependencies',
      severity: 'error',
      status: 'fail',
      title: 'Uninstalled Dependencies',
      message: 'node_modules/ directory is missing or empty. Application cannot execute.',
      fixable: true,
    });

    fixPlan.push({
      id: 'fix_install_deps',
      category: 'dependencies',
      description: `Install dependencies using ${pm} (${pm} install)`,
      details: `Executes package manager installation to populate node_modules/ safely.`,
      apply: () => {
        const installCmd = pm === 'yarn' ? 'yarn install' : `${pm} install`;
        execSync(installCmd, { cwd: targetDir, stdio: 'inherit' });
      },
    });
  } else {
    checks.push({
      id: 'deps_installed',
      category: 'dependencies',
      severity: 'info',
      status: 'pass',
      title: 'Dependencies Installed',
      message: 'node_modules/ directory is present and populated.',
      fixable: false,
    });
  }

  const hasLockfile =
    fs.existsSync(path.join(targetDir, 'package-lock.json')) ||
    fs.existsSync(path.join(targetDir, 'pnpm-lock.yaml')) ||
    fs.existsSync(path.join(targetDir, 'yarn.lock')) ||
    fs.existsSync(path.join(targetDir, 'bun.lockb')) ||
    fs.existsSync(path.join(targetDir, 'bun.lock'));

  if (!hasLockfile) {
    checks.push({
      id: 'lockfile_missing',
      category: 'dependencies',
      severity: 'info',
      status: 'warn',
      title: 'Missing Lockfile',
      message: 'No lockfile detected (package-lock.json, etc.). Lockfiles guarantee reproducible builds.',
      fixable: false,
    });
  } else {
    checks.push({
      id: 'lockfile_valid',
      category: 'dependencies',
      severity: 'info',
      status: 'pass',
      title: 'Dependency Lockfile',
      message: 'Lockfile is present for deterministic dependency resolution.',
      fixable: false,
    });
  }

  // ── 8. TypeScript Configuration Integrity ─────────────────────────────────
  if (isTs) {
    if (!fs.existsSync(tsconfigPath)) {
      checks.push({
        id: 'tsconfig_missing',
        category: 'typescript',
        severity: 'warning',
        status: 'warn',
        title: 'TypeScript Configuration',
        message: 'tsconfig.json was not found in TypeScript project.',
        fixable: true,
      });

      fixPlan.push({
        id: 'fix_create_tsconfig',
        category: 'typescript',
        description: 'Generate standard tsconfig.json with modern NodeNext and strict type-checking',
        details: 'Generates tsconfig.json with correct path aliases and compiler options.',
        apply: () => {
          const type = defaults.type || (pkg?.type === 'module' ? 'module' : 'commonjs');
          const arch = defaults.arch || 'minimal';
          const tsConfigObj = buildTsConfig(type, arch);
          fs.writeFileSync(tsconfigPath, JSON.stringify(tsConfigObj, null, 2) + '\n', 'utf8');
        },
      });
    } else {
      try {
        const tsconfigContent = fs.readFileSync(tsconfigPath, 'utf8');
        // Simple check for path aliases missing './'
        const hasBrokenPaths = /"@[a-zA-Z*\/]+"\s*:\s*\[\s*"[^\.\/]/i.test(tsconfigContent);
        if (hasBrokenPaths) {
          checks.push({
            id: 'tsconfig_paths_broken',
            category: 'typescript',
            severity: 'warning',
            status: 'warn',
            title: 'TypeScript Path Aliases (TS5090)',
            message: 'Path aliases in tsconfig.json are missing leading "./", which can fail compilation.',
            fixable: true,
          });

          fixPlan.push({
            id: 'fix_tsconfig_paths',
            category: 'typescript',
            description: 'Fix non-relative path aliases in tsconfig.json by prepending "./"',
            details: 'Resolves TS5090 errors by ensuring all path alias targets are relative.',
            apply: () => {
              let updated = fs.readFileSync(tsconfigPath, 'utf8');
              updated = updated.replace(/("@(?:routes|controllers|middlewares|models|config|utils|functions)\/\*"\s*:\s*\[\s*")([^.\/][^"]*")/g, '$1./$2');
              fs.writeFileSync(tsconfigPath, updated, 'utf8');
            },
          });
        } else {
          checks.push({
            id: 'tsconfig_valid',
            category: 'typescript',
            severity: 'info',
            status: 'pass',
            title: 'TypeScript Configuration',
            message: 'tsconfig.json compiler options and path aliases are valid.',
            fixable: false,
          });
        }
      } catch {
        // Skip on complex non-standard JSON comments
      }
    }
  }

  // ── Calculate Stats ───────────────────────────────────────────────────────
  const passed = checks.filter(c => c.status === 'pass').length;
  const warnings = checks.filter(c => c.status === 'warn').length;
  const errors = checks.filter(c => c.status === 'fail').length;

  return {
    targetDir,
    config,
    pkg,
    checks,
    fixPlan,
    stats: {
      total: checks.length,
      passed,
      warnings,
      errors,
      fixable: fixPlan.length,
    },
  };
}

/**
 * Execute repairs safely
 * @param {string} targetDir
 * @param {Array} fixPlan
 * @returns {Array} Applied repair summaries
 */
function applyRepairs(targetDir, fixPlan) {
  const applied = [];
  for (const item of fixPlan) {
    try {
      item.apply(targetDir);
      applied.push({ id: item.id, description: item.description, success: true });
    } catch (err) {
      applied.push({ id: item.id, description: item.description, success: false, error: err.message });
    }
  }
  return applied;
}

/**
 * CLI command orchestrator for `fogoe doctor [--fix]`
 */
async function runDoctor(options = {}) {
  const {
    cwd = process.cwd(),
    fix = false,
    yes = false,
    json = false,
    pm = null,
  } = options;

  const diagnostics = diagnoseProject(cwd, { pm });

  if (json) {
    if (fix && yes && diagnostics.fixPlan.length > 0) {
      const applied = applyRepairs(cwd, diagnostics.fixPlan);
      const postDiagnostics = diagnoseProject(cwd, { pm });
      console.log(JSON.stringify({
        mode: 'fix',
        appliedRepairs: applied,
        diagnostics: postDiagnostics.checks,
        stats: postDiagnostics.stats,
      }, null, 2));
      return;
    }

    console.log(JSON.stringify({
      mode: fix ? 'fix-preview' : 'diagnose',
      checks: diagnostics.checks,
      fixPlan: diagnostics.fixPlan.map(f => ({
        id: f.id,
        category: f.category,
        description: f.description,
        details: f.details,
      })),
      stats: diagnostics.stats,
    }, null, 2));
    return;
  }

  // Terminal Display Header
  console.log(chalk.cyan.bold('\n🩺 Fogoe Project Doctor — Diagnostic Suite\n'));

  // Group and display checks
  for (const check of diagnostics.checks) {
    let icon = chalk.green('✔');
    let titleColor = chalk.white.bold;
    if (check.status === 'warn') {
      icon = chalk.yellow('⚠');
      titleColor = chalk.yellow.bold;
    } else if (check.status === 'fail') {
      icon = chalk.red('✖');
      titleColor = chalk.red.bold;
    }

    console.log(`  ${icon} ${titleColor(check.title)}`);
    console.log(`    ${chalk.gray(check.message)}`);
  }

  console.log('');
  const { passed, warnings, errors, fixable } = diagnostics.stats;
  console.log(
    chalk.gray('  Summary: ') +
    chalk.green(`${passed} passed`) + chalk.gray(' | ') +
    (warnings > 0 ? chalk.yellow(`${warnings} warnings`) : chalk.gray('0 warnings')) + chalk.gray(' | ') +
    (errors > 0 ? chalk.red(`${errors} errors`) : chalk.gray('0 errors'))
  );

  // If not running with --fix
  if (!fix) {
    if (fixable > 0) {
      console.log(chalk.cyan(`\n  💡 ${fixable} issue(s) can be automatically repaired.`));
      console.log(chalk.gray(`     Run ${chalk.green('fogoe doctor --fix')} to review and apply safe repairs.\n`));
    } else if (errors === 0 && warnings === 0) {
      console.log(chalk.green('\n  ✨ Project is fully optimized and in excellent health!\n'));
    } else {
      console.log('');
    }
    return;
  }

  // ── FIX MODE ──────────────────────────────────────────────────────────────
  if (diagnostics.fixPlan.length === 0) {
    console.log(chalk.green('\n  ✨ No repairable issues found. Everything is in order!\n'));
    return;
  }

  console.log(chalk.yellow.bold(`\n  Proposed Repairs (${diagnostics.fixPlan.length} available):\n`));
  diagnostics.fixPlan.forEach((fixItem, idx) => {
    console.log(`  ${chalk.cyan(`[${idx + 1}]`)} ${chalk.white.bold(fixItem.description)}`);
    console.log(`      ${chalk.gray(fixItem.details)}`);
  });

  console.log(chalk.blue('\n  🛡️  Safety Guarantee:'));
  console.log(chalk.gray('     • Existing environment secrets in .env will NEVER be overwritten.'));
  console.log(chalk.gray('     • Existing application code or project files will NEVER be deleted.\n'));

  // Ask for confirmation
  let shouldProceed = yes;
  if (!shouldProceed) {
    try {
      shouldProceed = await confirm('Do you want Fogoe Doctor to apply these proposed repairs?');
    } catch {
      shouldProceed = false;
    }
  }

  if (!shouldProceed) {
    console.log(chalk.yellow('\n  Operation cancelled. No files or dependencies were modified.\n'));
    return;
  }

  console.log(chalk.cyan('\n  Applying repairs...\n'));
  const applied = applyRepairs(cwd, diagnostics.fixPlan);

  for (const item of applied) {
    if (item.success) {
      console.log(`  ${chalk.green('✔')} Fixed: ${item.description}`);
    } else {
      console.log(`  ${chalk.red('✖')} Failed: ${item.description} (${item.error})`);
    }
  }

  console.log(chalk.green.bold('\n  ✨ Doctor repairs completed! Run "fogoe doctor" to verify.\n'));
}

module.exports = {
  diagnoseProject,
  applyRepairs,
  runDoctor,
  parseEnvFile,
};
