const { execSync } = require('child_process');

/**
 * Checks if Git is installed
 */
function checkGitInstalled() {
  try {
    execSync('git --version', { stdio: 'ignore' });
    return true;
  } catch (err) {
    console.error('Git is not installed. Cannot initialize GitHub repository.');
    process.exit(1);
  }
}

/**
 * Checks if GitHub CLI is installed
 */
function hasGitHubCLI() {
  try {
    execSync('gh --version', { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

/**
 * Validates GitHub authentication via gh CLI or git config
 */
function checkGitHubAuth() {
  if (hasGitHubCLI()) {
    try {
      execSync('gh auth status', { stdio: 'ignore' });
      return true;
    } catch {
      // Fall through to git config check
    }
  }

  try {
    execSync('git config user.name', { stdio: 'ignore' });
    return true;
  } catch (err) {
    console.error(
      'Git user configuration not found. Please set git config user.name and user.email before continuing.',
    );
    process.exit(1);
  }
}

module.exports = { checkGitInstalled, checkGitHubAuth, hasGitHubCLI };
