const test = require('node:test');
const assert = require('node:assert');
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
  assert.ok(['npm', 'yarn', 'pnpm', 'bun'].includes(pm));
});
