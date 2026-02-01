const { execSync } = require('child_process');
const chalk = require('chalk');

/**
 * Initializes a new Git repository
 */
function gitInit() {
  try {
    execSync('git init', { stdio: 'ignore' });
    console.log(chalk.green('✓ Git repository initialized'));
  } catch (err) {
    console.error('Failed to initialize Git repository.');
    process.exit(1);
  }
}

/**
 * Stages all files for commit
 */
function gitAdd() {
  try {
    execSync('git add .', { stdio: 'ignore' });
    console.log(chalk.green('✓ Files staged'));
  } catch (err) {
    console.error('Failed to stage files.');
    process.exit(1);
  }
}

/**
 * Creates initial commit
 */
function gitCommit(message = 'Initial commit') {
  try {
    execSync(`git commit -m "${message}"`, { stdio: 'ignore' });
    console.log(chalk.green('✓ Initial commit created'));
  } catch (err) {
    console.error('Commit failed. Ensure there are files to commit.');
    process.exit(1);
  }
}

/**
 * Sets the main branch name
 */
function gitSetBranch(branchName) {
  try {
    execSync(`git branch -M ${branchName}`, { stdio: 'ignore' });
    console.log(chalk.green(`✓ Branch set to ${branchName}`));
  } catch (err) {
    console.error('Failed to set branch.');
    process.exit(1);
  }
}

/**
 * Adds remote origin
 */
function gitAddRemote(repoUrl) {
  try {
    execSync(`git remote add origin ${repoUrl}`, { stdio: 'ignore' });
    console.log(chalk.green('✓ Remote origin added'));
  } catch (err) {
    const existingRemotes = execSync('git remote', { encoding: 'utf8' });
    if (existingRemotes.includes('origin')) {
      console.error('Remote origin already exists.');
    } else {
      console.error('Failed to add remote repository.');
    }
    process.exit(1);
  }
}

/**
 * Verifies remote configuration
 */
function gitVerifyRemote() {
  try {
    execSync('git remote -v', { stdio: 'ignore' });
  } catch (err) {
    console.error('Failed to verify remote repository.');
    process.exit(1);
  }
}

/**
 * Pushes to remote repository
 */
function gitPush(branchName) {
  try {
    execSync(`git push -u origin ${branchName}`, { stdio: 'ignore' });
    console.log(chalk.green('✓ Repository pushed to GitHub'));
  } catch (err) {
    console.error('Failed to push repository to GitHub.');
    process.exit(1);
  }
}

module.exports = {
  gitInit,
  gitAdd,
  gitCommit,
  gitSetBranch,
  gitAddRemote,
  gitVerifyRemote,
  gitPush,
};
