const { execSync } = require('child_process');
const chalk = require('chalk');
const { ensureGitUserConfig } = require('./auth');

/**
 * Initializes a new Git repository and sets the initial branch
 * @param {string} targetDir
 * @param {string} branchName
 * @returns {{ success: boolean, branch: string, error?: string }}
 */
function gitInit(targetDir = process.cwd(), branchName = 'main') {
  try {
    try {
      execSync(`git init -b ${branchName}`, { cwd: targetDir, stdio: 'ignore' });
    } catch {
      execSync('git init', { cwd: targetDir, stdio: 'ignore' });
      try {
        execSync(`git symbolic-ref HEAD refs/heads/${branchName}`, { cwd: targetDir, stdio: 'ignore' });
      } catch {}
    }
    return { success: true, branch: branchName };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/**
 * Stages all files for commit
 * @param {string} targetDir
 * @returns {{ success: boolean, error?: string }}
 */
function gitAdd(targetDir = process.cwd()) {
  try {
    execSync('git add -A', { cwd: targetDir, stdio: 'ignore' });
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/**
 * Creates initial or standard commit
 * @param {string} message
 * @param {string} targetDir
 * @returns {{ success: boolean, message: string, error?: string }}
 */
function gitCommit(message = 'chore: initial project commit from Fogoe', targetDir = process.cwd()) {
  try {
    ensureGitUserConfig(targetDir);
    const safeMsg = message.replace(/"/g, '\\"');
    execSync(`git commit -m "${safeMsg}"`, { cwd: targetDir, stdio: 'ignore' });
    return { success: true, message };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/**
 * Sets the active branch name
 * @param {string} branchName
 * @param {string} targetDir
 * @returns {{ success: boolean, branch: string, error?: string }}
 */
function gitSetBranch(branchName = 'main', targetDir = process.cwd()) {
  try {
    execSync(`git branch -M ${branchName}`, { cwd: targetDir, stdio: 'ignore' });
    return { success: true, branch: branchName };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/**
 * Adds or updates remote repository URL
 * @param {string} repoUrl
 * @param {string} targetDir
 * @param {string} remoteName
 * @returns {{ success: boolean, remote: string, url: string, error?: string }}
 */
function gitAddRemote(repoUrl, targetDir = process.cwd(), remoteName = 'origin') {
  try {
    let existingRemotes = '';
    try {
      existingRemotes = execSync('git remote', { cwd: targetDir, encoding: 'utf8' });
    } catch {}

    const remoteList = existingRemotes.split('\n').map((r) => r.trim()).filter(Boolean);
    if (remoteList.includes(remoteName)) {
      execSync(`git remote set-url ${remoteName} "${repoUrl}"`, { cwd: targetDir, stdio: 'ignore' });
    } else {
      execSync(`git remote add ${remoteName} "${repoUrl}"`, { cwd: targetDir, stdio: 'ignore' });
    }
    return { success: true, remote: remoteName, url: repoUrl };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/**
 * Verifies remote configuration
 * @param {string} targetDir
 * @returns {string}
 */
function gitVerifyRemote(targetDir = process.cwd()) {
  try {
    return execSync('git remote -v', { cwd: targetDir, encoding: 'utf8' }).trim();
  } catch {
    return '';
  }
}

/**
 * Pushes to remote repository
 * @param {string} branchName
 * @param {string} targetDir
 * @param {string} remoteName
 * @returns {{ success: boolean, branch: string, remote: string, error?: string }}
 */
function gitPush(branchName = 'main', targetDir = process.cwd(), remoteName = 'origin') {
  try {
    execSync(`git push -u ${remoteName} ${branchName}`, { cwd: targetDir, stdio: 'ignore' });
    return { success: true, branch: branchName, remote: remoteName };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/**
 * Normalizes user-provided repository string into a valid Git remote URL
 * Handles:
 *  - "https://github.com/user/repo" -> "https://github.com/user/repo.git"
 *  - "user/repo" -> "https://github.com/user/repo.git"
 *  - "git@github.com:user/repo.git" -> unchanged
 * @param {string} input
 * @returns {string}
 */
function normalizeGitHubUrl(input) {
  if (!input) return '';
  const trimmed = input.trim();
  if (trimmed.startsWith('git@') || trimmed.endsWith('.git')) {
    return trimmed;
  }
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed.endsWith('.git') ? trimmed : `${trimmed}.git`;
  }
  if (/^[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+$/.test(trimmed)) {
    return `https://github.com/${trimmed}.git`;
  }
  return trimmed;
}

/**
 * Creates a repository on GitHub using the gh CLI
 * @param {Object} options
 * @param {string} options.name - Repository name
 * @param {boolean} options.isPrivate - Whether repo should be private
 * @param {boolean} options.push - Whether to push the current branch
 * @param {string} options.targetDir - Directory to run command in
 * @returns {{ success: boolean, url?: string, isPrivate?: boolean, error?: string }}
 */
function createGitHubRepo({ name, isPrivate = false, push = true, targetDir = process.cwd() }) {
  try {
    const visibilityFlag = isPrivate ? '--private' : '--public';
    const pushFlag = push ? '--push' : '';
    const cmd = `gh repo create ${name} ${visibilityFlag} --source=. --remote=origin ${pushFlag}`;
    const output = execSync(cmd, { cwd: targetDir, encoding: 'utf8' }).trim();
    return {
      success: true,
      url: output || `https://github.com/${name}`,
      isPrivate,
      pushed: push,
    };
  } catch (err) {
    return {
      success: false,
      error: err.message,
    };
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
  normalizeGitHubUrl,
  createGitHubRepo,
};
