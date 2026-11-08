const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const chalk = require('chalk');
const { select } = require('./prompts');
const { getPackageManager } = require('./installer');

async function updateProject(options = {}) {
  const packageJsonPath = path.join(process.cwd(), 'package.json');
  if (!fs.existsSync(packageJsonPath)) {
    console.error(chalk.red('\n  ✗ package.json not found.'));
    console.error(chalk.yellow('    Are you in a Node.js project directory?\n'));
    process.exit(1);
  }

  const pm = getPackageManager(options.pm, process.cwd());
  console.log(chalk.cyan(`\n  Detected package manager: ${chalk.bold(pm)}`));
  console.log(chalk.yellow(`  This will update all project dependencies using "${pm} update/upgrade".`));

  if (!options.yes) {
    const proceed = await select('Do you want to continue?', ['yes', 'no']);
    if (proceed !== 'yes') {
      console.log(chalk.cyan('  Update cancelled.'));
      return;
    }
  }

  console.log(chalk.cyan(`\n  Updating dependencies...`));
  const isWindows = process.platform === 'win32';

  try {
    if (pm === 'npm') {
      execFileSync('npm', ['update'], { stdio: 'inherit', shell: isWindows });
    } else if (pm === 'bun') {
      execFileSync('bun', ['update'], { stdio: 'inherit', shell: isWindows });
    } else if (pm === 'pnpm') {
      try {
        execFileSync('pnpm', ['update'], { stdio: 'inherit', shell: isWindows });
      } catch {
        execFileSync('pnpm', ['update', '--config.dangerouslyAllowAllBuilds=true'], { stdio: 'inherit', shell: isWindows });
      }
    } else if (pm === 'yarn') {
      execFileSync('yarn', ['upgrade'], { stdio: 'inherit', shell: isWindows });
    }
    console.log(chalk.green('\n  ✓ Dependencies updated successfully!\n'));
  } catch (err) {
    console.error(chalk.red('\n  ✗ Failed to update dependencies.'));
    process.exit(1);
  }
}

module.exports = { updateProject };
