const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { updateProject } = require('../src/update');

test('CLI update: throws error when package.json is missing and throwOnError is set', async () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fogoe-update-missing-'));

  try {
    await assert.rejects(
      async () => {
        await updateProject({
          cwd: tmpDir,
          yes: true,
          silent: true,
          throwOnError: true,
        });
      },
      /package\.json not found/
    );
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('CLI update: successfully updates dependencies in target directory non-interactively', async () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fogoe-update-exec-'));

  try {
    fs.writeFileSync(
      path.join(tmpDir, 'package.json'),
      JSON.stringify({
        name: 'test-update-app',
        version: '1.0.0',
        dependencies: {},
      }, null, 2)
    );

    const result = await updateProject({
      cwd: tmpDir,
      yes: true,
      silent: true,
      pm: 'npm',
      throwOnError: true,
    });

    assert.strictEqual(result.success, true);
    assert.strictEqual(result.pm, 'npm');
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});
