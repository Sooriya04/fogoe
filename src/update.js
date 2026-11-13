const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const chalk = require('chalk');
const { select } = require('./prompts');
const { getPackageManager } = require('./installer');

async function updateProject(options = {}) {
  const cwd = options.cwd || process.cwd();
  const packageJsonPath = path.join(cwd, 'package.json');
  if (!fs.existsSync(packageJsonPath)) {
    if (!options.silent) {
      console.error(chalk.red('\n  ✗ package.json not found.'));
      console.error(chalk.yellow('    Are you in a Node.js project directory?\n'));
    }
    if (options.throwOnError) {
      throw new Error('package.json not found');
    }
    process.exit(1);
  }

  const pm = getPackageManager(options.pm, cwd);
  if (!options.silent) {
    console.log(chalk.cyan(`\n  Detected package manager: ${chalk.bold(pm)}`));
    console.log(chalk.yellow(`  This will update all project dependencies using "${pm} update/upgrade".`));
  }

  if (!options.yes) {
    const proceed = await select('Do you want to continue?', ['yes', 'no']);
    if (proceed !== 'yes') {
      if (!options.silent) console.log(chalk.cyan('  Update cancelled.'));
      return { success: false, cancelled: true };
    }
  }

  if (!options.silent) console.log(chalk.cyan(`\n  Updating dependencies...`));
  const isWindows = process.platform === 'win32';
  const stdio = options.silent ? 'ignore' : 'inherit';

  try {
    if (pm === 'npm') {
      execFileSync('npm', ['update'], { cwd, stdio, shell: isWindows });
    } else if (pm === 'bun') {
      execFileSync('bun', ['update'], { cwd, stdio, shell: isWindows });
    } else if (pm === 'pnpm') {
      try {
        execFileSync('pnpm', ['update'], { cwd, stdio, shell: isWindows });
      } catch {
        execFileSync('pnpm', ['update', '--config.dangerouslyAllowAllBuilds=true'], { cwd, stdio, shell: isWindows });
      }
    } else if (pm === 'yarn') {
      execFileSync('yarn', ['upgrade'], { cwd, stdio, shell: isWindows });
    }
    if (!options.silent) console.log(chalk.green('\n  ✓ Dependencies updated successfully!\n'));
    return { success: true, pm };
  } catch (err) {
    if (!options.silent) console.error(chalk.red('\n  ✗ Failed to update dependencies.'));
    if (options.throwOnError) {
      throw err;
    }
    process.exit(1);
  }
}

module.exports = { updateProject };
