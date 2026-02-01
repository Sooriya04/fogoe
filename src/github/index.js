const { input } = require('../prompts');
const chalk = require('chalk');
const { setupGitignore } = require('./gitignore');
const { checkGitInstalled, checkGitHubAuth } = require('./auth');
const {
  gitInit,
  gitAdd,
  gitCommit,
  gitSetBranch,
  gitAddRemote,
  gitVerifyRemote,
  gitPush,
} = require('./commands');

/**
 * Main function to initialize GitHub repository
 * Orchestrates all git operations in sequence
 */
async function initGit() {
  console.log('\nInitializing GitHub Repository...\n');

  // Setup .gitignore
  setupGitignore();

  // Check prerequisites
  checkGitInstalled();
  checkGitHubAuth();

  // Get user input
  const branchName = (await input('Branch name', 'main')) || 'main';
  const repoUrl = await input('GitHub repository URL');

  if (!repoUrl) {
    console.error('Repository URL is required.');
    process.exit(1);
  }

  // Execute git commands
  gitInit();
  gitAdd();
  gitCommit();
  gitSetBranch(branchName);
  gitAddRemote(repoUrl);
  gitVerifyRemote();
  gitPush(branchName);

  console.log(chalk.green('\n✓ GitHub repository initialized successfully!'));
}

// Re-export individual modules for flexibility
module.exports = {
  initGit,
  // From auth
  checkGitInstalled,
  checkGitHubAuth,
  // From gitignore
  setupGitignore,
  // From commands
  gitInit,
  gitAdd,
  gitCommit,
  gitSetBranch,
  gitAddRemote,
  gitVerifyRemote,
  gitPush,
};
