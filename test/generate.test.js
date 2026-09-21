const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const { execSync } = require('node:child_process');
const { composeProject } = require('../src/composer');
const { generateComponent } = require('../src/generate');

const TEST_OUTPUT_DIR = path.join(__dirname, 'temp_generate_cmd');

test('CLI generate: route, controller, and model in MVC project', () => {
  if (fs.existsSync(TEST_OUTPUT_DIR)) {
    fs.rmSync(TEST_OUTPUT_DIR, { recursive: true, force: true });
  }

  // First compose an MVC project
  composeProject({
    targetDir: TEST_OUTPUT_DIR,
    name: 'test-generate-app',
    language: 'javascript',
    runtime: 'express',
    type: 'commonjs',
    architecture: 'mvc',
    database: 'mongodb',
    hashing: 'bcrypt',
  });

  // Write fogoe.config.json in the target directory
  fs.writeFileSync(
    path.join(TEST_OUTPUT_DIR, 'fogoe.config.json'),
    JSON.stringify({
      defaults: {
        language: 'js',
        arch: 'mvc',
        runtime: 'express',
        type: 'cjs',
      }
    }, null, 2)
  );

  const prevCwd = process.cwd();
  try {
    process.chdir(TEST_OUTPUT_DIR);

    generateComponent('route', 'user');
    generateComponent('controller', 'user');
    generateComponent('model', 'user');

    assert.ok(fs.existsSync(path.join(TEST_OUTPUT_DIR, 'src/routes/user.js')));
    assert.ok(fs.existsSync(path.join(TEST_OUTPUT_DIR, 'src/controllers/usercontroller.js')));
    assert.ok(fs.existsSync(path.join(TEST_OUTPUT_DIR, 'src/models/user.js')));

    // Syntax check
    execSync(`node --check ${path.join(TEST_OUTPUT_DIR, 'src/routes/user.js')}`);
    execSync(`node --check ${path.join(TEST_OUTPUT_DIR, 'src/controllers/usercontroller.js')}`);
    execSync(`node --check ${path.join(TEST_OUTPUT_DIR, 'src/models/user.js')}`);
  } finally {
    process.chdir(prevCwd);
    if (fs.existsSync(TEST_OUTPUT_DIR)) {
      fs.rmSync(TEST_OUTPUT_DIR, { recursive: true, force: true });
    }
  }
});
