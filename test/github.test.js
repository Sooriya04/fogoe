const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const { execSync } = require('node:child_process');

const {
  generateGitignoreContent,
  setupGitignore,
} = require('../src/github/gitignore');
const {
  isGitInstalled,
  hasGitUserConfig,
  ensureGitUserConfig,
} = require('../src/github/auth');
const {
  gitInit,
  gitAdd,
  gitCommit,
  gitSetBranch,
  gitAddRemote,
  gitVerifyRemote,
  normalizeGitHubUrl,
} = require('../src/github/commands');
const { setupGitRepository } = require('../src/github');

const TEST_DIR = path.join(__dirname, 'temp_git_test');

function cleanTemp() {
  if (fs.existsSync(TEST_DIR)) {
    fs.rmSync(TEST_DIR, { recursive: true, force: true });
  }
}

test.beforeEach(cleanTemp);
test.after(cleanTemp);

test('Gitignore: Stack-aware generator includes SQLite and TypeScript rules', () => {
  const content = generateGitignoreContent({
    language: 'typescript',
    database: 'sqlite',
    testing: true,
  });

  assert.ok(content.includes('node_modules/'), 'Should include node_modules/');
  assert.ok(content.includes('.env'), 'Should include .env');
  assert.ok(content.includes('dist/'), 'Should include dist/');
  assert.ok(content.includes('*.tsbuildinfo'), 'Should include tsbuildinfo for TypeScript');
  assert.ok(content.includes('coverage/'), 'Should include coverage/ for testing');
  assert.ok(content.includes('*.db'), 'Should include *.db for SQLite');
  assert.ok(content.includes('*.sqlite'), 'Should include *.sqlite for SQLite');
});

test('Gitignore: Stack-aware generator includes Prisma rules', () => {
  const content = generateGitignoreContent({
    language: 'javascript',
    database: 'prisma',
  });

  assert.ok(content.includes('prisma/*.db'), 'Should include prisma/*.db');
});

test('Gitignore: setupGitignore creates new file and appends missing rules cleanly', () => {
  fs.mkdirSync(TEST_DIR, { recursive: true });

  // 1. Initial creation
  const created = setupGitignore({ language: 'typescript', database: 'sqlite' }, TEST_DIR);
  const gitignorePath = path.join(TEST_DIR, '.gitignore');
  assert.ok(fs.existsSync(gitignorePath));
  assert.ok(created.includes('node_modules/'));
  assert.ok(created.includes('*.sqlite'));

  // 2. Simulate existing file missing a rule
  fs.writeFileSync(gitignorePath, 'node_modules/\n.env\n', 'utf8');
  const updated = setupGitignore({ language: 'typescript', database: 'sqlite' }, TEST_DIR);
  assert.ok(updated.includes('dist/'));
  assert.ok(updated.includes('*.sqlite'));
});

test('GitHub Commands: normalizeGitHubUrl converts formats to standard git URLs', () => {
  assert.strictEqual(
    normalizeGitHubUrl('Sooriya04/fogoe'),
    'https://github.com/Sooriya04/fogoe.git'
  );
  assert.strictEqual(
    normalizeGitHubUrl('https://github.com/Sooriya04/fogoe'),
    'https://github.com/Sooriya04/fogoe.git'
  );
  assert.strictEqual(
    normalizeGitHubUrl('https://github.com/Sooriya04/fogoe.git'),
    'https://github.com/Sooriya04/fogoe.git'
  );
  assert.strictEqual(
    normalizeGitHubUrl('git@github.com:Sooriya04/fogoe.git'),
    'git@github.com:Sooriya04/fogoe.git'
  );
});

test('Git Init & Branch: Initializes repository and sets default branch to main', () => {
  fs.mkdirSync(TEST_DIR, { recursive: true });

  const res = gitInit(TEST_DIR, 'main');
  assert.strictEqual(res.success, true);
  assert.ok(fs.existsSync(path.join(TEST_DIR, '.git')));

  const branch = execSync('git symbolic-ref --short HEAD', { cwd: TEST_DIR, encoding: 'utf8' }).trim();
  assert.strictEqual(branch, 'main');
});

test('Git Commit: Stages files and creates initial commit with fallback identity', () => {
  fs.mkdirSync(TEST_DIR, { recursive: true });
  gitInit(TEST_DIR, 'main');

  fs.writeFileSync(path.join(TEST_DIR, 'README.md'), '# Test Project\n');
  const addRes = gitAdd(TEST_DIR);
  assert.strictEqual(addRes.success, true);

  const commitRes = gitCommit('chore: initial commit for testing', TEST_DIR);
  assert.strictEqual(commitRes.success, true);
  assert.strictEqual(commitRes.message, 'chore: initial commit for testing');

  const log = execSync('git log -1 --pretty=%B', { cwd: TEST_DIR, encoding: 'utf8' }).trim();
  assert.strictEqual(log, 'chore: initial commit for testing');
});

test('Git Remote: Adds remote and updates existing remote without throwing', () => {
  fs.mkdirSync(TEST_DIR, { recursive: true });
  gitInit(TEST_DIR, 'main');

  const addRes = gitAddRemote('https://github.com/test/repo1.git', TEST_DIR);
  assert.strictEqual(addRes.success, true);
  assert.strictEqual(addRes.url, 'https://github.com/test/repo1.git');

  // Updating existing remote
  const updateRes = gitAddRemote('https://github.com/test/repo2.git', TEST_DIR);
  assert.strictEqual(updateRes.success, true);
  assert.strictEqual(updateRes.url, 'https://github.com/test/repo2.git');

  const verify = gitVerifyRemote(TEST_DIR);
  assert.ok(verify.includes('https://github.com/test/repo2.git'));
});

test('setupGitRepository: Full orchestration initializes repo, .gitignore, and commit', async () => {
  fs.mkdirSync(TEST_DIR, { recursive: true });
  fs.writeFileSync(path.join(TEST_DIR, 'server.js'), 'console.log("hello");\n');

  const result = await setupGitRepository({
    targetDir: TEST_DIR,
    stack: { language: 'javascript', runtime: 'express', database: 'sqlite' },
    git: true,
    commit: 'feat: bootstrap express api',
    silent: true,
  });

  assert.strictEqual(result.initialized, true);
  assert.strictEqual(result.committed, true);
  assert.strictEqual(result.commitMessage, 'feat: bootstrap express api');
  assert.strictEqual(result.branch, 'main');

  assert.ok(fs.existsSync(path.join(TEST_DIR, '.git')));
  assert.ok(fs.existsSync(path.join(TEST_DIR, '.gitignore')));

  const gitignoreContent = fs.readFileSync(path.join(TEST_DIR, '.gitignore'), 'utf8');
  assert.ok(gitignoreContent.includes('*.sqlite'));

  const log = execSync('git log -1 --pretty=%B', { cwd: TEST_DIR, encoding: 'utf8' }).trim();
  assert.strictEqual(log, 'feat: bootstrap express api');
});
