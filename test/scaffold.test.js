const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');
const { buildPackageJson } = require('../src/packageJson');
const { getPackageManager } = require('../src/installer');

test('packageJson builder', (t) => {
  const meta = {
    name: 'test-app',
    version: '1.0.0',
    description: 'A test app',
    author: 'Test',
    license: 'MIT',
    type: 'module',
    language: 'javascript'
  };

  const pkg = buildPackageJson(meta);

  assert.strictEqual(pkg.name, 'test-app');
  assert.strictEqual(pkg.version, '1.0.0');
  assert.strictEqual(pkg.type, 'module');
  assert.strictEqual(pkg.scripts.dev, 'nodemon src/server.js');
});

test('packageJson builder for typescript', (t) => {
  const meta = {
    name: 'ts-app',
    version: '1.0.0',
    description: 'A ts app',
    author: 'Test',
    license: 'MIT',
    type: 'commonjs',
    language: 'typescript'
  };

  const pkg = buildPackageJson(meta);

  assert.strictEqual(pkg.name, 'ts-app');
  assert.strictEqual(pkg.scripts.dev, 'tsx watch src/server.ts');
});

test('package manager detection fallback', (t) => {
  const pm = getPackageManager();
  assert.strictEqual(pm, 'npm');
});

test('package manager preferred PM override', (t) => {
  assert.strictEqual(getPackageManager('pnpm'), 'pnpm');
  assert.strictEqual(getPackageManager('bun'), 'bun');
  assert.strictEqual(getPackageManager('yarn'), 'yarn');
  assert.strictEqual(getPackageManager('npm'), 'npm');
});

test('CLI scaffolding: sanitizes directory name with spaces/uppercase into valid package name', () => {
  const tmpParent = fs.mkdtempSync(path.join(os.tmpdir(), 'fogoe-name-test-'));
  const targetDir = path.join(tmpParent, 'My Project Name');
  const cliPath = path.resolve(__dirname, '../bin/cli.js');

  try {
    fs.mkdirSync(targetDir);
    execSync(`node "${cliPath}" -y --language js --framework express --no-install --no-git`, {
      cwd: targetDir,
      stdio: 'ignore',
    });

    const pkg = JSON.parse(fs.readFileSync(path.join(targetDir, 'package.json'), 'utf8'));
    assert.strictEqual(pkg.name, 'my-project-name');
  } finally {
    fs.rmSync(tmpParent, { recursive: true, force: true });
  }
});

