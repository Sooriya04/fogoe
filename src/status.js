const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const chalk = require('chalk');

function checkStatus(options = {}) {
  const configPath = path.join(process.cwd(), 'fogoe.config.json');
  if (!fs.existsSync(configPath)) {
    if (options.json) {
      console.log(JSON.stringify({ success: false, error: 'fogoe.config.json not found' }));
      process.exit(1);
    }
    console.error(chalk.red('\n  ✗ fogoe.config.json not found.'));
    console.error(chalk.yellow('    Are you in a Fogoe project?\n'));
    process.exit(1);
  }

  let config = {};
  try {
    config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  } catch (err) {
    if (options.json) {
      console.log(JSON.stringify({ success: false, error: 'Failed to parse fogoe.config.json' }));
      process.exit(1);
    }
    console.error(chalk.red('\n  ✗ Failed to parse fogoe.config.json.'));
    process.exit(1);
  }

  const { defaults = {}, addons = [] } = config;
  const { language = 'unknown', runtime = 'unknown', arch = 'unknown', type = 'unknown', git = false } = defaults;

  // Check database configuration
  let database = 'none';
  let dbUrlConfigured = false;
  const envPath = path.join(process.cwd(), '.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const dbUrlMatch = envContent.match(/DATABASE_URL=(.*)/);
    if (dbUrlMatch && dbUrlMatch[1].trim()) {
      dbUrlConfigured = true;
    }
  }

  // Determine database selection from files
  if (fs.existsSync(path.join(process.cwd(), 'prisma/schema.prisma'))) {
    database = 'Prisma';
  } else {
    // Check config/db file if exists
    const dbConfigPathJs = path.join(process.cwd(), 'src/config/db.js');
    const dbConfigPathTs = path.join(process.cwd(), 'src/config/db.ts');
    const dbFile = fs.existsSync(dbConfigPathJs) ? dbConfigPathJs : (fs.existsSync(dbConfigPathTs) ? dbConfigPathTs : null);
    if (dbFile) {
      const content = fs.readFileSync(dbFile, 'utf8');
      if (content.includes('mongoose')) database = 'MongoDB (Mongoose)';
      else if (content.includes('drizzle')) database = 'Drizzle ORM (PostgreSQL)';
      else if (content.includes('mysql2')) database = 'MySQL';
      else if (content.includes('better-sqlite3')) database = 'SQLite (better-sqlite3)';
      else if (content.includes('pg')) database = 'PostgreSQL';
    }
  }

  // Check Git status
  let gitStatusText = 'Not Initialized';
  let isGitRepo = false;
  let branch = '';
  try {
    execSync('git rev-parse --is-inside-work-tree', { stdio: 'ignore' });
    isGitRepo = true;
  } catch (err) {}

  if (isGitRepo) {
    try {
      try {
        branch = execSync('git symbolic-ref --short HEAD', { encoding: 'utf8' }).trim();
      } catch {
        try {
          branch = execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8' }).trim();
        } catch {
          branch = 'main';
        }
      }
      const changes = execSync('git status --porcelain', { encoding: 'utf8' }).trim();
      const count = changes ? changes.split('\n').length : 0;
      if (count > 0) {
        gitStatusText = `${chalk.green('Initialized ✓')}, branch: ${chalk.bold(branch)}, ${chalk.yellow(count + ' uncommitted changes')}`;
      } else {
        gitStatusText = `${chalk.green('Initialized ✓')}, branch: ${chalk.bold(branch)}, ${chalk.green('clean')}`;
      }
    } catch (err) {
      gitStatusText = chalk.green('Initialized ✓');
    }
  } else if (git) {
    gitStatusText = chalk.yellow('Configured in fogoe but git repo not initialized');
  }

  let originRemote = null;
  if (isGitRepo) {
    try {
      const remotes = execSync('git remote -v', { encoding: 'utf8' }).trim();
      const match = remotes.match(/origin\s+([^\s]+)/);
      if (match && match[1]) {
        originRemote = match[1];
      }
    } catch (err) {}
  }

  if (options.json) {
    console.log(JSON.stringify({
      success: true,
      language: language === 'ts' ? 'TypeScript' : 'JavaScript',
      framework: runtime,
      architecture: arch,
      moduleSystem: type === 'esm' ? 'ES Modules' : 'CommonJS',
      database: {
        type: database,
        configured: dbUrlConfigured,
      },
      git: {
        initialized: isGitRepo,
        branch: branch || null,
        remote: originRemote,
      },
      addons: addons || [],
    }, null, 2));
    return;
  }

  console.log(chalk.cyan.bold('\n--- Fogoe Project Status ---'));
  console.log(`${chalk.bold('  Language:')}     ${language === 'ts' ? 'TypeScript' : 'JavaScript'}`);
  console.log(`${chalk.bold('  Framework:')}    ${runtime.charAt(0).toUpperCase() + runtime.slice(1)}`);
  console.log(`${chalk.bold('  Architecture:')} ${arch.toUpperCase()}`);
  console.log(`${chalk.bold('  Module system:')} ${type === 'esm' ? 'ES Modules' : 'CommonJS'}`);

  if (database !== 'none') {
    const connectionStatus = dbUrlConfigured ? chalk.green('configured ✓') : chalk.yellow('missing DATABASE_URL in .env ⚠');
    console.log(`${chalk.bold('  Database:')}     ${database} (${connectionStatus})`);
  } else {
    console.log(`${chalk.bold('  Database:')}     None`);
  }

  console.log(`${chalk.bold('  Git:')}          ${gitStatusText}`);

  if (originRemote) {
    console.log(`${chalk.bold('  Remote:')}       ${chalk.cyan(originRemote)}`);
  }

  // Display Addons
  if (addons && addons.length > 0) {
    console.log(`${chalk.bold('  Addons:')}       ${addons.map(a => chalk.yellow(a)).join(', ')}`);
  } else {
    console.log(`${chalk.bold('  Addons:')}       None`);
  }
  console.log(chalk.cyan.bold('----------------------------\n'));
}

module.exports = { checkStatus };
