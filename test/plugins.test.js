const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');
const { checkNpmPackageExists, resolveTypesPackage } = require('../src/plugins');
const { uninstallPackageList } = require('../src/installer');

test('npm package resolver: checks package existence on registry', () => {
  assert.strictEqual(checkNpmPackageExists('lodash'), true);
  assert.strictEqual(checkNpmPackageExists('chalk'), true);
  assert.strictEqual(checkNpmPackageExists('non-existent-package-fogoe-999999'), false);
  // Rejects invalid names and shell injection without shelling out
  assert.strictEqual(checkNpmPackageExists('foo; touch /tmp/hacked'), false);
  assert.strictEqual(checkNpmPackageExists('Invalid Name'), false);
});

test('npm package resolver: detects external types package for lodash', () => {
  const typesPkg = resolveTypesPackage('lodash');
  assert.strictEqual(typesPkg, '@types/lodash');
});

test('npm package resolver: returns null when package bundles its own types', () => {
  const typesPkg = resolveTypesPackage('axios');
  assert.strictEqual(typesPkg, null);
});

test('CLI add command: supports arbitrary npm package via --json', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fogoe-add-test-'));
  try {
    fs.writeFileSync(
      path.join(tmpDir, 'package.json'),
      JSON.stringify({ name: 'test-app', version: '1.0.0', dependencies: {} }, null, 2)
    );
    fs.writeFileSync(
      path.join(tmpDir, 'fogoe.config.json'),
      JSON.stringify({ defaults: { language: 'js', type: 'cjs' } }, null, 2)
    );

    const cliPath = path.resolve(__dirname, '../bin/cli.js');
    const output = execSync(`node ${cliPath} add is-sorted --json`, {
      cwd: tmpDir,
      encoding: 'utf8',
    });

    const parsed = JSON.parse(output.trim());
    assert.strictEqual(parsed.success, true);
    assert.strictEqual(parsed.package, 'is-sorted');

    const pkg = JSON.parse(fs.readFileSync(path.join(tmpDir, 'package.json'), 'utf8'));
    assert.ok(pkg.dependencies['is-sorted'], 'is-sorted was saved to dependencies');
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('CLI add command: pre-configured plugin with envVars outputs clean parseable JSON via --json', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fogoe-add-json-env-'));
  try {
    fs.writeFileSync(
      path.join(tmpDir, 'package.json'),
      JSON.stringify({ name: 'test-app', version: '1.0.0', dependencies: {} }, null, 2)
    );
    fs.writeFileSync(
      path.join(tmpDir, 'fogoe.config.json'),
      JSON.stringify({ defaults: { language: 'js', type: 'cjs', runtime: 'express' } }, null, 2)
    );

    const cliPath = path.resolve(__dirname, '../bin/cli.js');
    const output = execSync(`node ${cliPath} add redis --json`, {
      cwd: tmpDir,
      encoding: 'utf8',
    });

    const parsed = JSON.parse(output.trim());
    assert.strictEqual(parsed.success, true);
    assert.strictEqual(parsed.plugin, 'redis');
    assert.strictEqual(parsed.outputFile, 'src/config/redis.js');

    const envContent = fs.readFileSync(path.join(tmpDir, '.env'), 'utf8');
    assert.ok(envContent.includes('REDIS_URL='), '.env should be populated with REDIS_URL');
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('CLI remove command: removes package, cleans @types, and updates fogoe.config.json', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fogoe-remove-test-'));
  try {
    fs.writeFileSync(
      path.join(tmpDir, 'package.json'),
      JSON.stringify(
        {
          name: 'test-app',
          version: '1.0.0',
          dependencies: { 'is-sorted': '^1.0.0' },
          devDependencies: { '@types/is-sorted': '^1.0.0' },
        },
        null,
        2
      )
    );
    fs.writeFileSync(
      path.join(tmpDir, 'fogoe.config.json'),
      JSON.stringify({ defaults: { language: 'ts' }, addons: ['redis', 'is-sorted'] }, null, 2)
    );

    const cliPath = path.resolve(__dirname, '../bin/cli.js');
    const output = execSync(`node ${cliPath} remove is-sorted --json`, {
      cwd: tmpDir,
      encoding: 'utf8',
    });

    const parsed = JSON.parse(output.trim());
    assert.strictEqual(parsed.success, true);
    assert.strictEqual(parsed.package, 'is-sorted');
    assert.strictEqual(parsed.configUpdated, true);

    const pkg = JSON.parse(fs.readFileSync(path.join(tmpDir, 'package.json'), 'utf8'));
    assert.strictEqual(pkg.dependencies?.['is-sorted'], undefined);
    assert.strictEqual(pkg.devDependencies?.['@types/is-sorted'], undefined);

    const config = JSON.parse(fs.readFileSync(path.join(tmpDir, 'fogoe.config.json'), 'utf8'));
    assert.deepStrictEqual(config.addons, ['redis']);
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('Installer: uninstallPackageList gracefully handles failures without throwing', () => {
  // Test invalid package manager or failed execution with silent: true
  const res = uninstallPackageList({
    packages: 'non-existent-pkg-xyz',
    pm: 'invalid-pm-binary-999',
    silent: true,
  });
  // Since invalid-pm-binary-999 falls back to npm/default or throws, the helper catches and returns false/true safely
  assert.strictEqual(typeof res, 'boolean');
});

test('CLI add and remove: cleanly exits with JSON error when package argument is omitted in --json mode', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fogoe-json-err-'));
  const cliPath = path.resolve(__dirname, '../bin/cli.js');

  try {
    fs.writeFileSync(
      path.join(tmpDir, 'package.json'),
      JSON.stringify({ name: 'test-app', version: '1.0.0', dependencies: {} }, null, 2)
    );
    fs.writeFileSync(
      path.join(tmpDir, 'fogoe.config.json'),
      JSON.stringify({ defaults: { language: 'js', type: 'cjs' } }, null, 2)
    );

    // fogoe add --json without package name
    assert.throws(() => {
      execSync(`node "${cliPath}" add --json`, {
        cwd: tmpDir,
        encoding: 'utf8',
      });
    }, (err) => {
      const parsed = JSON.parse(err.stdout.trim());
      assert.strictEqual(parsed.success, false);
      assert.ok(parsed.error.includes('Package name required'));
      return true;
    });

    // fogoe remove --json without package name
    assert.throws(() => {
      execSync(`node "${cliPath}" remove --json`, {
        cwd: tmpDir,
        encoding: 'utf8',
      });
    }, (err) => {
      const parsed = JSON.parse(err.stdout.trim());
      assert.strictEqual(parsed.success, false);
      assert.ok(parsed.error.includes('Package name required'));
      return true;
    });
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});


