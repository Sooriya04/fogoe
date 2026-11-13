const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');

test('CLI status: accurately detects database from config defaults when db file is absent', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fogoe-status-test-'));
  const cliPath = path.resolve(__dirname, '../bin/cli.js');

  try {
    fs.writeFileSync(
      path.join(tmpDir, 'fogoe.config.json'),
      JSON.stringify({
        defaults: {
          database: 'postgresql',
          runtime: 'express',
          language: 'ts',
          arch: 'minimal',
          type: 'esm',
        },
      }, null, 2)
    );

    const output = execSync(`node "${cliPath}" status --json`, {
      cwd: tmpDir,
      encoding: 'utf8',
    });

    const parsed = JSON.parse(output.trim());
    assert.strictEqual(parsed.success, true);
    assert.strictEqual(parsed.database.type, 'PostgreSQL');
    assert.strictEqual(parsed.framework, 'express');
    assert.strictEqual(parsed.language, 'TypeScript');
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('CLI status: does not inherit parent git repository status when project has no .git folder', () => {
  const tmpParent = fs.mkdtempSync(path.join(os.tmpdir(), 'fogoe-status-git-parent-'));
  const tmpChild = path.join(tmpParent, 'child-project');
  const cliPath = path.resolve(__dirname, '../bin/cli.js');

  try {
    // Initialize git in parent
    execSync('git init -b feature-parent', { cwd: tmpParent, stdio: 'ignore' });
    fs.mkdirSync(tmpChild);

    fs.writeFileSync(
      path.join(tmpChild, 'fogoe.config.json'),
      JSON.stringify({
        defaults: {
          database: 'none',
          runtime: 'hono',
          language: 'js',
          git: false,
        },
      }, null, 2)
    );

    const output = execSync(`node "${cliPath}" status --json`, {
      cwd: tmpChild,
      encoding: 'utf8',
    });

    const parsed = JSON.parse(output.trim());
    assert.strictEqual(parsed.success, true);
    assert.strictEqual(parsed.git.initialized, false, 'Child project without .git should not report initialized git');
    assert.strictEqual(parsed.git.branch, null);
  } finally {
    fs.rmSync(tmpParent, { recursive: true, force: true });
  }
});
