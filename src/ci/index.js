const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const { select, confirm } = require('../prompts');
const { generateGitHubActionsWorkflow } = require('./githubActions');
const { generateDockerfile, generateDockerignore } = require('./docker');
const { DEPLOY_TARGETS, isValidDeployTarget, getRequiredSecrets } = require('./deploy');
const { getPackageManager } = require('../installer');

/**
 * Detects current project technology stack from config or files
 * @param {string} targetDir
 * @returns {Object} Detected stack metadata
 */
function detectProjectStack(targetDir = process.cwd()) {
  let language = 'javascript';
  let pm = getPackageManager();
  let testing = false;
  let linting = false;
  let port = '3000';

  const configPath = path.join(targetDir, 'fogoe.config.json');
  if (fs.existsSync(configPath)) {
    try {
      const cfg = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      if (cfg.defaults) {
        if (cfg.defaults.language === 'ts' || cfg.defaults.language === 'typescript') {
          language = 'typescript';
        }
      }
    } catch {}
  } else {
    // Detect by tsconfig
    if (fs.existsSync(path.join(targetDir, 'tsconfig.json'))) {
      language = 'typescript';
    }
  }

  const pkgPath = path.join(targetDir, 'package.json');
  if (fs.existsSync(pkgPath)) {
    try {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
      if (pkg.scripts) {
        if (pkg.scripts.test) testing = true;
        if (pkg.scripts.lint) linting = true;
      }
      if (pkg.devDependencies) {
        if (pkg.devDependencies.vitest || pkg.devDependencies.jest) testing = true;
        if (pkg.devDependencies.eslint) linting = true;
      }
    } catch {}
  }

  // Detect port from .env if present
  const envPath = path.join(targetDir, '.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const portMatch = envContent.match(/PORT=(\d+)/);
    if (portMatch) port = portMatch[1];
  }

  return { language, pm, testing, linting, port };
}

/**
 * Main CI/CD Orchestrator for setting up workflows and Docker files
 *
 * @param {Object} options
 * @param {string} [options.targetDir]
 * @param {boolean} [options.ci] - Whether to generate GitHub Actions
 * @param {boolean} [options.docker] - Whether to generate Dockerfile
 * @param {string} [options.deploy] - Deployment platform
 * @param {boolean} [options.isNonInteractive]
 * @param {boolean} [options.silent]
 * @returns {Promise<Object>} Setup status and created files
 */
async function setupCiCd(options = {}) {
  const {
    targetDir = process.cwd(),
    isNonInteractive = false,
    silent = false,
  } = options;

  const stack = detectProjectStack(targetDir);
  let generateCi = options.ci !== undefined ? Boolean(options.ci) : false;
  let generateDocker = options.docker !== undefined ? Boolean(options.docker) : false;
  let deployTarget = options.deploy || 'none';

  // Interactive selection if invoked manually without flags
  if (!isNonInteractive && options.ci === undefined && options.docker === undefined) {
    const ciChoice = await select('Configure CI/CD automated pipeline?', [
      { value: 'all', label: 'Complete CI/CD & Docker (GitHub Actions + Dockerfile)' },
      { value: 'ci_only', label: 'GitHub Actions CI only (Test, Lint, Build)' },
      { value: 'docker_only', label: 'Docker containerization only (Dockerfile + .dockerignore)' },
      { value: 'none', label: 'Skip CI/CD configuration' },
    ]);

    if (ciChoice === 'none' || !ciChoice) {
      return { configured: false, files: [] };
    }

    if (ciChoice === 'all') {
      generateCi = true;
      generateDocker = true;
    } else if (ciChoice === 'ci_only') {
      generateCi = true;
    } else if (ciChoice === 'docker_only') {
      generateDocker = true;
    }

    if (generateCi) {
      const deployChoice = await select('Select deployment target:', [
        { value: 'none', label: 'None — CI testing & building only' },
        { value: 'dockerhub', label: 'Docker Hub — Build & push container image' },
        { value: 'fly', label: 'Fly.io — Auto-deploy on main push' },
        { value: 'railway', label: 'Railway — Auto-deploy on main push' },
        { value: 'render', label: 'Render — Webhook deploy hook trigger' },
      ]);
      deployTarget = deployChoice || 'none';
      if (deployTarget === 'dockerhub' || deployTarget === 'fly') {
        generateDocker = true;
      }
    }
  }

  const createdFiles = [];

  // 1. Generate Dockerfile and .dockerignore
  if (generateDocker) {
    const dockerfilePath = path.join(targetDir, 'Dockerfile');
    const dockerignorePath = path.join(targetDir, '.dockerignore');

    const dockerContent = generateDockerfile({
      language: stack.language,
      pm: stack.pm,
      port: stack.port,
    });
    const dockerignoreContent = generateDockerignore();

    fs.writeFileSync(dockerfilePath, dockerContent);
    fs.writeFileSync(dockerignorePath, dockerignoreContent);
    createdFiles.push('Dockerfile', '.dockerignore');

    if (!silent) {
      console.log(chalk.green('  ✓ Created production Dockerfile'));
      console.log(chalk.green('  ✓ Created .dockerignore'));
    }
  }

  // 2. Generate GitHub Actions workflow
  if (generateCi) {
    const workflowsDir = path.join(targetDir, '.github/workflows');
    fs.mkdirSync(workflowsDir, { recursive: true });
    const ciFilePath = path.join(workflowsDir, 'ci.yml');

    const ciContent = generateGitHubActionsWorkflow({
      name: 'CI/CD Pipeline',
      language: stack.language,
      pm: stack.pm,
      testing: stack.testing,
      linting: stack.linting,
      docker: generateDocker,
      deploy: deployTarget,
    });

    fs.writeFileSync(ciFilePath, ciContent);
    createdFiles.push('.github/workflows/ci.yml');

    if (!silent) {
      console.log(chalk.green('  ✓ Created .github/workflows/ci.yml'));
    }

    const secrets = getRequiredSecrets(deployTarget);
    if (!silent && secrets.length > 0) {
      console.log(chalk.yellow(`\n  ⚠ Action Required for ${DEPLOY_TARGETS[deployTarget].label}:`));
      console.log(chalk.gray(`    Add the following repository secrets on GitHub:`));
      secrets.forEach((s) => console.log(chalk.cyan(`    • ${s}`)));
      console.log('');
    }
  }

  // Update fogoe.config.json if it exists
  const configPath = path.join(targetDir, 'fogoe.config.json');
  if (fs.existsSync(configPath)) {
    try {
      const cfg = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      if (!cfg.addons) cfg.addons = [];
      if (generateCi && !cfg.addons.includes('ci')) cfg.addons.push('ci');
      if (generateDocker && !cfg.addons.includes('docker')) cfg.addons.push('docker');
      fs.writeFileSync(configPath, JSON.stringify(cfg, null, 2));
    } catch {}
  }

  return {
    configured: generateCi || generateDocker,
    ci: generateCi,
    docker: generateDocker,
    deploy: deployTarget,
    files: createdFiles,
  };
}

module.exports = {
  detectProjectStack,
  setupCiCd,
};
