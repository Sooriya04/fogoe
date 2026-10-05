const { execSync } = require('child_process');

/**
 * Checks if Git is installed and available in PATH
 * @returns {boolean}
 */
function isGitInstalled() {
  try {
    execSync('git --version', { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

/**
 * Backward-compatible check for Git installation
 * @returns {boolean}
 */
function checkGitInstalled() {
  const installed = isGitInstalled();
  if (!installed) {
    console.error('Git is not installed. Cannot initialize Git/GitHub repository.');
  }
  return installed;
}

/**
 * Checks if GitHub CLI (gh) is installed
 * @returns {boolean}
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
 * Checks if GitHub CLI is authenticated
 * @returns {boolean}
 */
function isGitHubAuthenticated() {
  if (!hasGitHubCLI()) return false;
  try {
    execSync('gh auth status', { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

/**
 * Validates GitHub authentication via gh CLI or git config
 * @returns {boolean}
 */
function checkGitHubAuth() {
  if (isGitHubAuthenticated()) {
    return true;
  }

  try {
    execSync('git config user.name', { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

/**
 * Checks if git user.name and user.email are configured
 * @param {string} targetDir
 * @returns {boolean}
 */
function hasGitUserConfig(targetDir = process.cwd()) {
  try {
    const name = execSync('git config user.name', { cwd: targetDir, stdio: 'pipe', encoding: 'utf8' }).trim();
    const email = execSync('git config user.email', { cwd: targetDir, stdio: 'pipe', encoding: 'utf8' }).trim();
    return Boolean(name && email);
  } catch {
    return false;
  }
}

/**
 * Ensures git user identity is configured in target repository
 * If global or local identity is missing, sets a safe fallback local config
 * to prevent commits from failing on CI/clean environments.
 * @param {string} targetDir
 */
function ensureGitUserConfig(targetDir = process.cwd()) {
  try {
    execSync('git config user.name', { cwd: targetDir, stdio: 'ignore' });
  } catch {
    try {
      execSync('git config user.name "Fogoe"', { cwd: targetDir, stdio: 'ignore' });
    } catch {}
  }

  try {
    execSync('git config user.email', { cwd: targetDir, stdio: 'ignore' });
  } catch {
    try {
      execSync('git config user.email "fogoe@local"', { cwd: targetDir, stdio: 'ignore' });
    } catch {}
  }
}

module.exports = {
  isGitInstalled,
  checkGitInstalled,
  hasGitHubCLI,
  isGitHubAuthenticated,
  checkGitHubAuth,
  hasGitUserConfig,
  ensureGitUserConfig,
};
