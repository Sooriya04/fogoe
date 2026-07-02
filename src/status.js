const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const chalk = require('chalk');

function checkStatus() {
  const configPath = path.join(process.cwd(), 'fogoe.config.json');
  if (!fs.existsSync(configPath)) {
    console.error(chalk.red('\n  ✗ fogoe.config.json not found.'));
    console.error(chalk.yellow('    Are you in a Fogoe project?\n'));
    process.exit(1);
  }

  let config = {};
  try {
    config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  } catch (err) {
    console.error(chalk.red('\n  ✗ Failed to parse fogoe.config.json.'));
    process.exit(1);
  }

  const { defaults = {}, addons = [] } = config;
  const { language = 'unknown', runtime = 'unknown', arch = 'unknown', type = 'unknown', git = false } = defaults;

  console.log(chalk.cyan.bold('\n--- Fogoe Project Status ---'));
  console.log(`${chalk.bold('  Language:')}     ${language === 'ts' ? 'TypeScript' : 'JavaScript'}`);
  console.log(`${chalk.bold('  Framework:')}    ${runtime.charAt(0).toUpperCase() + runtime.slice(1)}`);
  console.log(`${chalk.bold('  Architecture:')} ${arch.toUpperCase()}`);
  console.log(`${chalk.bold('  Module system:')} ${type === 'esm' ? 'ES Modules' : 'CommonJS'}`);

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
      else if (content.includes('mysql2')) database = 'MySQL';
      else if (content.includes('pg')) database = 'PostgreSQL';
    }
  }
  
  if (database !== 'none') {
    const connectionStatus = dbUrlConfigured ? chalk.green('configured ✓') : chalk.yellow('missing DATABASE_URL in .env ⚠');
    console.log(`${chalk.bold('  Database:')}     ${database} (${connectionStatus})`);
  } else {
    console.log(`${chalk.bold('  Database:')}     None`);
  }

  // Check Git status
  let gitStatusText = 'Not Initialized';
  let isGitRepo = false;
  try {
    execSync('git rev-parse --is-inside-work-tree', { stdio: 'ignore' });
    isGitRepo = true;
  } catch (err) {}

  if (isGitRepo) {
    try {
      const branch = execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8' }).trim();
      const changes = execSync('git status --porcelain', { encoding: 'utf8' }).trim();
      const count = changes ? changes.split('\n').length : 0;
      if (count > 0) {
        gitStatusText = `${chalk.green('Initialized ✓')}, branch: ${chalk.bold(branch)}, ${chalk.yellow(count + ' uncommitted changes')}`;
      } else {
        gitStatusText = `${chalk.green('Initialized ✓')}, branch: ${chalk.bold(branch)}, ${chalk.green('clean')}`;
      }
    } catch (err) {
      gitStatusText = chalk.green('Initialized ✓ (unable to read branch/status)');
    }
  } else if (git) {
    gitStatusText = chalk.yellow('Configured in fogoe but git repo not initialized');
  }

  console.log(`${chalk.bold('  Git:')}          ${gitStatusText}`);

  // Display Addons
  if (addons && addons.length > 0) {
    console.log(`${chalk.bold('  Addons:')}       ${addons.map(a => chalk.yellow(a)).join(', ')}`);
  } else {
    console.log(`${chalk.bold('  Addons:')}       None`);
  }
  console.log(chalk.cyan.bold('----------------------------\n'));
}

module.exports = { checkStatus };
