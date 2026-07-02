const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const chalk = require('chalk');
const { select } = require('./prompts');
const { getPackageManager } = require('./installer');

async function updateProject() {
  const packageJsonPath = path.join(process.cwd(), 'package.json');
  if (!fs.existsSync(packageJsonPath)) {
    console.error(chalk.red('\n  ✗ package.json not found.'));
    console.error(chalk.yellow('    Are you in a Node.js project directory?\n'));
    process.exit(1);
  }

  const pm = getPackageManager();
  console.log(chalk.cyan(`\n  Detected package manager: ${chalk.bold(pm)}`));
  console.log(chalk.yellow(`  This will update all project dependencies using "${pm} update/upgrade".`));

  const proceed = await select('Do you want to continue?', ['yes', 'no']);
  if (proceed !== 'yes') {
    console.log(chalk.cyan('  Update cancelled.'));
    return;
  }

  console.log(chalk.cyan(`\n  Updating dependencies...`));
  try {
    if (pm === 'npm') {
      execSync('npm update', { stdio: 'inherit' });
    } else if (pm === 'bun') {
      execSync('bun update', { stdio: 'inherit' });
    } else if (pm === 'pnpm') {
      execSync('pnpm update', { stdio: 'inherit' });
    } else if (pm === 'yarn') {
      execSync('yarn upgrade', { stdio: 'inherit' });
    }
    console.log(chalk.green('\n  ✓ Dependencies updated successfully!\n'));
  } catch (err) {
    console.error(chalk.red('\n  ✗ Failed to update dependencies.'));
    process.exit(1);
  }
}

module.exports = { updateProject };
