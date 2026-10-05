const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const { input, select } = require('../prompts');
const { setupGitignore, generateGitignoreContent } = require('./gitignore');
const {
  isGitInstalled,
  checkGitInstalled,
  hasGitHubCLI,
  isGitHubAuthenticated,
  checkGitHubAuth,
  hasGitUserConfig,
  ensureGitUserConfig,
} = require('./auth');
const {
  gitInit,
  gitAdd,
  gitCommit,
  gitSetBranch,
  gitAddRemote,
  gitVerifyRemote,
  gitPush,
  normalizeGitHubUrl,
  createGitHubRepo,
} = require('./commands');

/**
 * Unified Git and GitHub setup orchestrator for Fogoe projects
 * @param {Object} options
 * @returns {Promise<Object>} Status of Git/GitHub setup
 */
async function setupGitRepository(options = {}) {
  const {
    targetDir = process.cwd(),
    stack = {},
    git = false,
    github = null,
    isPrivate = false,
    commit = null,
    branch = 'main',
    projectName = '',
    isNonInteractive = false,
    silent = false,
  } = options;

  // 1. Always setup stack-aware .gitignore
  setupGitignore(stack, targetDir);

  if (!git && !github && (commit === null || commit === false)) {
    return { initialized: false, gitignoreConfigured: true };
  }

  // 2. Check if Git is installed
  if (!isGitInstalled()) {
    if (!silent) {
      console.log(chalk.yellow('\n⚠ Git is not installed or not found in PATH. Skipping Git initialization.'));
    }
    return { initialized: false, error: 'git_not_installed' };
  }

  const result = {
    initialized: false,
    branch,
    committed: false,
    commitMessage: null,
    github: null,
  };

  // 3. Initialize Git repository
  const initRes = gitInit(targetDir, branch);
  if (!initRes.success) {
    if (!silent) {
      console.log(chalk.red(`\n✗ Failed to initialize Git repository: ${initRes.error}`));
    }
    return { ...result, error: initRes.error };
  }

  result.initialized = true;
  if (!silent) {
    console.log(chalk.green(`✓ Initialized Git repository (branch: ${chalk.bold(branch)})`));
  }

  // 4. Initial Commit
  const shouldCommit = commit !== false && (commit !== null || github);
  if (shouldCommit) {
    gitAdd(targetDir);
    const commitMsg =
      typeof commit === 'string' && commit.trim().length > 0
        ? commit.trim()
        : 'chore: initial project commit from Fogoe';

    const commitRes = gitCommit(commitMsg, targetDir);
    if (commitRes.success) {
      result.committed = true;
      result.commitMessage = commitMsg;
      if (!silent) {
        console.log(chalk.green(`✓ Created initial project commit: "${chalk.dim(commitMsg)}"`));
      }
    } else if (!silent) {
      console.log(chalk.yellow(`⚠ Could not create initial commit: ${commitRes.error || 'no staged changes'}`));
    }
  }

  // 5. GitHub Repository Setup
  if (github) {
    const isUrl = typeof github === 'string' && github.trim().length > 0;

    if (isUrl) {
      // Connect to explicit repository URL or owner/repo slug
      const remoteUrl = normalizeGitHubUrl(github);
      const remoteRes = gitAddRemote(remoteUrl, targetDir);

      if (remoteRes.success) {
        if (!silent) {
          console.log(chalk.green(`✓ Configured remote origin: ${chalk.cyan(remoteUrl)}`));
        }

        const pushRes = gitPush(branch, targetDir);
        if (pushRes.success) {
          result.github = {
            remote: remoteUrl,
            pushed: true,
          };
          if (!silent) {
            console.log(chalk.green(`✓ Pushed ${branch} branch to GitHub (${chalk.cyan(remoteUrl)})`));
          }
        } else {
          result.github = {
            remote: remoteUrl,
            pushed: false,
            error: pushRes.error,
          };
          if (!silent) {
            console.log(
              chalk.yellow('⚠ Remote origin added, but initial push failed. Ensure remote exists and credentials match.'),
            );
          }
        }
      } else {
        result.github = {
          remote: remoteUrl,
          pushed: false,
          error: remoteRes.error,
        };
      }
    } else if (hasGitHubCLI() && isGitHubAuthenticated()) {
      // Automatic creation via GitHub CLI (gh)
      const repoName = projectName || path.basename(targetDir);
      if (!silent) {
        console.log(
          chalk.cyan(`\nCreating ${isPrivate ? 'private' : 'public'} GitHub repository "${repoName}" via gh CLI...`),
        );
      }

      const ghRes = createGitHubRepo({
        name: repoName,
        isPrivate,
        push: true,
        targetDir,
      });

      if (ghRes.success) {
        result.github = {
          created: true,
          name: repoName,
          isPrivate,
          pushed: true,
          url: ghRes.url,
        };
        if (!silent) {
          console.log(chalk.green(`✓ GitHub repository created & pushed: ${chalk.cyan(ghRes.url)}`));
        }
      } else {
        result.github = {
          created: false,
          error: ghRes.error,
        };
        if (!silent) {
          console.log(chalk.yellow(`⚠ gh repo create failed: ${ghRes.error}`));
        }
      }
    } else if (!isNonInteractive) {
      // Interactive fallback when gh CLI is unavailable or unauthenticated
      if (!silent) {
        console.log(chalk.yellow('\nGitHub CLI (gh) is not authenticated.'));
      }
      const repoUrl = await input('Enter existing GitHub repository URL (or press Enter to skip)');
      if (repoUrl && repoUrl.trim()) {
        const remoteUrl = normalizeGitHubUrl(repoUrl);
        gitAddRemote(remoteUrl, targetDir);
        const pushRes = gitPush(branch, targetDir);
        result.github = {
          remote: remoteUrl,
          pushed: pushRes.success,
        };
        if (pushRes.success && !silent) {
          console.log(chalk.green(`✓ Pushed to GitHub repository: ${chalk.cyan(remoteUrl)}`));
        }
      }
    } else if (!silent) {
      console.log(
        chalk.yellow('⚠ GitHub repository creation skipped: gh CLI not authenticated and no remote URL provided.'),
      );
    }
  }

  return result;
}

/**
 * Backward-compatible initGit for interactive `fogoe init` command
 * @param {string} targetDir
 */
async function initGit(targetDir = process.cwd()) {
  const stack = {};
  const configPath = path.join(targetDir, 'fogoe.config.json');
  if (fs.existsSync(configPath)) {
    try {
      const cfg = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      if (cfg.defaults) Object.assign(stack, cfg.defaults);
    } catch {}
  }

  const ghAvailable = hasGitHubCLI() && isGitHubAuthenticated();

  let githubChoice = false;
  let isPrivate = false;

  const shouldSetupGitHub = await select('Would you like to connect or create a GitHub repository?', ['no', 'yes']);

  if (shouldSetupGitHub === 'yes') {
    if (ghAvailable) {
      const action = await select('How would you like to set up GitHub?', [
        { value: 'create_public', label: 'Create new Public GitHub repository' },
        { value: 'create_private', label: 'Create new Private GitHub repository' },
        { value: 'connect_url', label: 'Connect to existing GitHub repository URL' },
      ]);

      if (action === 'create_public') {
        githubChoice = true;
        isPrivate = false;
      } else if (action === 'create_private') {
        githubChoice = true;
        isPrivate = true;
      } else {
        const repoUrl = await input('GitHub repository URL (https://github.com/owner/repo.git)');
        githubChoice = repoUrl ? repoUrl.trim() : null;
      }
    } else {
      const repoUrl = await input('GitHub repository URL (https://github.com/owner/repo.git)');
      githubChoice = repoUrl ? repoUrl.trim() : null;
    }
  }

  return await setupGitRepository({
    targetDir,
    stack,
    git: true,
    commit: true,
    github: githubChoice,
    isPrivate,
  });
}

module.exports = {
  setupGitRepository,
  initGit,
  // Auth
  isGitInstalled,
  checkGitInstalled,
  hasGitHubCLI,
  isGitHubAuthenticated,
  checkGitHubAuth,
  hasGitUserConfig,
  ensureGitUserConfig,
  // Gitignore
  setupGitignore,
  generateGitignoreContent,
  // Commands
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
