const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const { diagnoseProject, applyRepairs, parseEnvFile } = require('../src/doctor');

const TEST_DOCTOR_DIR = path.join(__dirname, 'temp_doctor_test');

function cleanTemp() {
  if (fs.existsSync(TEST_DOCTOR_DIR)) {
    fs.rmSync(TEST_DOCTOR_DIR, { recursive: true, force: true });
  }
}

test.beforeEach(cleanTemp);
test.after(cleanTemp);

test('parseEnvFile: correctly parses keys, values, and ignores comments and blanks', () => {
  const content = `
# Environment config
PORT=4000
DATABASE_URL=postgresql://localhost:5432/testdb
JWT_SECRET=super_secret_token_123

# Extra comments
EMPTY_VAR=
  SPACED_VAR = hello world  
`;
  const parsed = parseEnvFile(content);
  assert.strictEqual(parsed.PORT, '4000');
  assert.strictEqual(parsed.DATABASE_URL, 'postgresql://localhost:5432/testdb');
  assert.strictEqual(parsed.JWT_SECRET, 'super_secret_token_123');
  assert.strictEqual(parsed.EMPTY_VAR, '');
  assert.strictEqual(parsed.SPACED_VAR, 'hello world');
});

test('Doctor Diagnosis: detects missing fogoe.config.json and package.json', () => {
  fs.mkdirSync(TEST_DOCTOR_DIR, { recursive: true });

  const result = diagnoseProject(TEST_DOCTOR_DIR);
  assert.strictEqual(result.stats.errors >= 2, true);

  const configCheck = result.checks.find(c => c.id === 'config_missing');
  const pkgCheck = result.checks.find(c => c.id === 'package_missing');

  assert.ok(configCheck);
  assert.strictEqual(configCheck.status, 'fail');
  assert.ok(pkgCheck);
  assert.strictEqual(pkgCheck.status, 'fail');
});

test('Doctor Security: flags unignored .env in .gitignore as critical security risk', () => {
  fs.mkdirSync(TEST_DOCTOR_DIR, { recursive: true });

  // Minimal valid config and pkg
  fs.writeFileSync(path.join(TEST_DOCTOR_DIR, 'fogoe.config.json'), JSON.stringify({
    defaults: { runtime: 'express', language: 'js', database: 'none' }
  }));
  fs.writeFileSync(path.join(TEST_DOCTOR_DIR, 'package.json'), JSON.stringify({
    name: 'test-app',
    dependencies: { express: '^4.19.0' },
    scripts: { dev: 'nodemon src/server.js', start: 'node src/server.js' }
  }));

  // .gitignore that forgets .env
  fs.writeFileSync(path.join(TEST_DOCTOR_DIR, '.gitignore'), 'node_modules/\ndist/\n');

  const result = diagnoseProject(TEST_DOCTOR_DIR);
  const secCheck = result.checks.find(c => c.id === 'gitignore_env_unprotected');

  assert.ok(secCheck, 'Should flag unprotected .env');
  assert.strictEqual(secCheck.status, 'fail');
  assert.strictEqual(secCheck.severity, 'error');

  const fixPlanItem = result.fixPlan.find(f => f.id === 'fix_update_gitignore');
  assert.ok(fixPlanItem, 'Should propose updating .gitignore');
});

test('Doctor Scripts: detects missing standard scripts and creates repair plan', () => {
  fs.mkdirSync(TEST_DOCTOR_DIR, { recursive: true });

  fs.writeFileSync(path.join(TEST_DOCTOR_DIR, 'fogoe.config.json'), JSON.stringify({
    defaults: { runtime: 'express', language: 'ts', database: 'none' }
  }));
  // package.json without dev/start/build scripts
  fs.writeFileSync(path.join(TEST_DOCTOR_DIR, 'package.json'), JSON.stringify({
    name: 'test-app',
    dependencies: { express: '^4.19.0' },
    scripts: { test: 'vitest' }
  }));

  const result = diagnoseProject(TEST_DOCTOR_DIR);
  const scriptCheck = result.checks.find(c => c.id === 'scripts_missing');
  assert.ok(scriptCheck);
  assert.strictEqual(scriptCheck.status, 'warn');

  // Apply script repairs
  const scriptFix = result.fixPlan.find(f => f.id === 'fix_scripts');
  assert.ok(scriptFix);
  scriptFix.apply();

  // Verify scripts were added cleanly
  const updatedPkg = JSON.parse(fs.readFileSync(path.join(TEST_DOCTOR_DIR, 'package.json'), 'utf8'));
  assert.ok(updatedPkg.scripts.dev);
  assert.ok(updatedPkg.scripts.start);
  assert.ok(updatedPkg.scripts.build);
  assert.strictEqual(updatedPkg.scripts.test, 'vitest', 'Should preserve existing scripts');
});

test('Doctor Secret Safety: appends missing variables but NEVER overwrites existing secrets', () => {
  fs.mkdirSync(TEST_DOCTOR_DIR, { recursive: true });

  fs.writeFileSync(path.join(TEST_DOCTOR_DIR, 'fogoe.config.json'), JSON.stringify({
    defaults: { runtime: 'fastify', language: 'ts', database: 'postgresql', auth: 'jwt' }
  }));
  fs.writeFileSync(path.join(TEST_DOCTOR_DIR, 'package.json'), JSON.stringify({
    name: 'safe-app',
    dependencies: { fastify: '^4.26.0' },
    scripts: { dev: 'tsx watch src/server.ts', start: 'tsx src/server.ts', build: 'tsc' }
  }));

  // Existing .env with custom secret already set by user
  const initialCustomSecret = 'production_super_secret_99999_keep_this';
  fs.writeFileSync(path.join(TEST_DOCTOR_DIR, '.env'), `JWT_SECRET=${initialCustomSecret}\nPORT=8080\n`);

  const result = diagnoseProject(TEST_DOCTOR_DIR);

  // DATABASE_URL is missing, but JWT_SECRET is present
  const envCheck = result.checks.find(c => c.id === 'env_keys_missing');
  assert.ok(envCheck);
  assert.ok(envCheck.message.includes('DATABASE_URL'));
  assert.strictEqual(envCheck.message.includes('JWT_SECRET'), false, 'JWT_SECRET is already set');

  const envFix = result.fixPlan.find(f => f.id === 'fix_append_env');
  assert.ok(envFix);
  envFix.apply();

  // Verify .env contents
  const updatedEnvRaw = fs.readFileSync(path.join(TEST_DOCTOR_DIR, '.env'), 'utf8');
  const parsed = parseEnvFile(updatedEnvRaw);

  assert.strictEqual(parsed.JWT_SECRET, initialCustomSecret, 'Existing secret MUST NOT be overwritten');
  assert.strictEqual(parsed.PORT, '8080', 'Existing PORT MUST NOT be overwritten');
  assert.ok(parsed.DATABASE_URL.includes('postgresql://'), 'Missing DATABASE_URL should be appended');
});

test('Doctor Secret Safety: warns on placeholder secrets without altering them', () => {
  fs.mkdirSync(TEST_DOCTOR_DIR, { recursive: true });

  fs.writeFileSync(path.join(TEST_DOCTOR_DIR, 'fogoe.config.json'), JSON.stringify({
    defaults: { runtime: 'express', language: 'js', auth: 'jwt' }
  }));
  fs.writeFileSync(path.join(TEST_DOCTOR_DIR, 'package.json'), JSON.stringify({
    name: 'warn-app',
    dependencies: { express: '^4.19.0' },
    scripts: { dev: 'nodemon src/server.js', start: 'node src/server.js' }
  }));
  fs.writeFileSync(path.join(TEST_DOCTOR_DIR, '.env'), 'PORT=3000\nJWT_SECRET=your-secret-key\n');

  const result = diagnoseProject(TEST_DOCTOR_DIR);
  const warnCheck = result.checks.find(c => c.id === 'env_jwt_secret_insecure');

  assert.ok(warnCheck, 'Should flag insecure placeholder secret');
  assert.strictEqual(warnCheck.status, 'warn');
  assert.strictEqual(warnCheck.fixable, false, 'Should not auto-overwrite existing secret');
});

test('Doctor TypeScript: detects broken path aliases (TS5090) and repairs them', () => {
  fs.mkdirSync(TEST_DOCTOR_DIR, { recursive: true });

  fs.writeFileSync(path.join(TEST_DOCTOR_DIR, 'fogoe.config.json'), JSON.stringify({
    defaults: { runtime: 'express', language: 'ts', arch: 'mvc' }
  }));
  fs.writeFileSync(path.join(TEST_DOCTOR_DIR, 'package.json'), JSON.stringify({
    name: 'ts-app',
    dependencies: { express: '^4.19.0' },
    devDependencies: { typescript: '^5.0.0' },
    scripts: { dev: 'tsx watch src/server.ts', start: 'tsx src/server.ts', build: 'tsc' }
  }));

  // tsconfig with non-relative path aliases (triggers TS5090)
  const badTsConfig = {
    compilerOptions: {
      baseUrl: "./src",
      paths: {
        "@routes/*": ["routes/*"],
        "@controllers/*": ["controllers/*"]
      }
    }
  };
  fs.writeFileSync(path.join(TEST_DOCTOR_DIR, 'tsconfig.json'), JSON.stringify(badTsConfig, null, 2));

  const result = diagnoseProject(TEST_DOCTOR_DIR);
  const tsCheck = result.checks.find(c => c.id === 'tsconfig_paths_broken');
  assert.ok(tsCheck);
  assert.strictEqual(tsCheck.status, 'warn');

  const tsFix = result.fixPlan.find(f => f.id === 'fix_tsconfig_paths');
  assert.ok(tsFix);
  tsFix.apply();

  const fixedTsConfig = JSON.parse(fs.readFileSync(path.join(TEST_DOCTOR_DIR, 'tsconfig.json'), 'utf8'));
  assert.deepStrictEqual(fixedTsConfig.compilerOptions.paths['@routes/*'], ['./routes/*']);
  assert.deepStrictEqual(fixedTsConfig.compilerOptions.paths['@controllers/*'], ['./controllers/*']);
});

test('applyRepairs: safely executes multi-item repair plan and returns results', () => {
  fs.mkdirSync(TEST_DOCTOR_DIR, { recursive: true });

  fs.writeFileSync(path.join(TEST_DOCTOR_DIR, 'fogoe.config.json'), JSON.stringify({
    defaults: { runtime: 'hono', language: 'ts', database: 'mongodb' }
  }));
  fs.writeFileSync(path.join(TEST_DOCTOR_DIR, 'package.json'), JSON.stringify({
    name: 'repair-app',
    dependencies: {},
    scripts: {}
  }));

  const initialReport = diagnoseProject(TEST_DOCTOR_DIR);
  assert.ok(initialReport.fixPlan.length >= 3, 'Should have multiple repairs planned');

  // Filter out install_deps for unit test to avoid running actual npm install
  const nonInstallFixes = initialReport.fixPlan.filter(f => f.id !== 'fix_install_deps');
  const applied = applyRepairs(TEST_DOCTOR_DIR, nonInstallFixes);

  assert.strictEqual(applied.length, nonInstallFixes.length);
  for (const item of applied) {
    assert.strictEqual(item.success, true, `Fix ${item.id} should succeed`);
  }

  // Verify repaired files exist
  assert.ok(fs.existsSync(path.join(TEST_DOCTOR_DIR, '.gitignore')));
  assert.ok(fs.existsSync(path.join(TEST_DOCTOR_DIR, '.env')));
  assert.ok(fs.existsSync(path.join(TEST_DOCTOR_DIR, 'tsconfig.json')));

  const gitignore = fs.readFileSync(path.join(TEST_DOCTOR_DIR, '.gitignore'), 'utf8');
  assert.ok(gitignore.includes('.env'));
  assert.ok(gitignore.includes('node_modules/'));
});

test('Doctor Framework: detects missing framework dependency in package.json and repairs it', () => {
  fs.mkdirSync(TEST_DOCTOR_DIR, { recursive: true });

  fs.writeFileSync(path.join(TEST_DOCTOR_DIR, 'fogoe.config.json'), JSON.stringify({
    defaults: { runtime: 'fastify', language: 'js', database: 'none' }
  }));
  fs.writeFileSync(path.join(TEST_DOCTOR_DIR, 'package.json'), JSON.stringify({
    name: 'dep-test-app',
    dependencies: {},
    scripts: { dev: 'node server.js', start: 'node server.js' }
  }));

  const report = diagnoseProject(TEST_DOCTOR_DIR);
  const depCheck = report.checks.find(c => c.id === 'dep_framework_missing');
  assert.ok(depCheck, 'Should flag missing fastify');
  assert.strictEqual(depCheck.status, 'fail');

  const depFix = report.fixPlan.find(f => f.id === 'fix_dep_framework');
  assert.ok(depFix);
  depFix.apply();

  const updatedPkg = JSON.parse(fs.readFileSync(path.join(TEST_DOCTOR_DIR, 'package.json'), 'utf8'));
  assert.strictEqual(updatedPkg.dependencies.fastify, 'latest');
});

test('Doctor Database Env: generates stack-tailored DATABASE_URL for MongoDB and MySQL', () => {
  fs.mkdirSync(TEST_DOCTOR_DIR, { recursive: true });

  // MongoDB test
  fs.writeFileSync(path.join(TEST_DOCTOR_DIR, 'fogoe.config.json'), JSON.stringify({
    defaults: { runtime: 'express', language: 'js', database: 'mongodb' }
  }));
  fs.writeFileSync(path.join(TEST_DOCTOR_DIR, 'package.json'), JSON.stringify({
    name: 'mongo-app',
    dependencies: { express: '^4.19.0' },
    scripts: { dev: 'node index.js', start: 'node index.js' }
  }));

  const mongoReport = diagnoseProject(TEST_DOCTOR_DIR);
  const mongoEnvFix = mongoReport.fixPlan.find(f => f.id === 'fix_create_env');
  assert.ok(mongoEnvFix);
  mongoEnvFix.apply();

  let envRaw = fs.readFileSync(path.join(TEST_DOCTOR_DIR, '.env'), 'utf8');
  assert.ok(envRaw.includes('mongodb://localhost:27017/app_dev'));

  // Cleanup .env and test MySQL
  fs.unlinkSync(path.join(TEST_DOCTOR_DIR, '.env'));
  fs.writeFileSync(path.join(TEST_DOCTOR_DIR, 'fogoe.config.json'), JSON.stringify({
    defaults: { runtime: 'express', language: 'js', database: 'mysql' }
  }));

  const mysqlReport = diagnoseProject(TEST_DOCTOR_DIR);
  const mysqlEnvFix = mysqlReport.fixPlan.find(f => f.id === 'fix_create_env');
  assert.ok(mysqlEnvFix);
  mysqlEnvFix.apply();

  envRaw = fs.readFileSync(path.join(TEST_DOCTOR_DIR, '.env'), 'utf8');
  assert.ok(envRaw.includes('mysql://root:root@localhost:3306/app_dev'));
});

test('Doctor Clean Health: fully configured project reports 0 errors and 0 warnings', () => {
  fs.mkdirSync(TEST_DOCTOR_DIR, { recursive: true });

  fs.writeFileSync(path.join(TEST_DOCTOR_DIR, 'fogoe.config.json'), JSON.stringify({
    defaults: { runtime: 'express', language: 'js', database: 'none' }
  }));
  fs.writeFileSync(path.join(TEST_DOCTOR_DIR, 'package.json'), JSON.stringify({
    name: 'healthy-app',
    dependencies: { express: '^4.19.0' },
    scripts: { dev: 'nodemon src/server.js', start: 'node src/server.js' }
  }));
  fs.writeFileSync(path.join(TEST_DOCTOR_DIR, '.gitignore'), 'node_modules/\n.env\ndist/\n');
  fs.writeFileSync(path.join(TEST_DOCTOR_DIR, '.env'), 'PORT=3000\n');
  fs.mkdirSync(path.join(TEST_DOCTOR_DIR, 'node_modules'), { recursive: true });
  fs.writeFileSync(path.join(TEST_DOCTOR_DIR, 'node_modules', '.test-dummy'), 'ok');
  fs.writeFileSync(path.join(TEST_DOCTOR_DIR, 'package-lock.json'), '{}');

  const report = diagnoseProject(TEST_DOCTOR_DIR);
  assert.strictEqual(report.stats.errors, 0, 'Should have 0 errors');
  assert.strictEqual(report.stats.warnings, 0, 'Should have 0 warnings');
  assert.strictEqual(report.stats.fixable, 0, 'Should have 0 fixable items');
});

test('Doctor CLI Integration: node bin/cli.js doctor --json outputs structured diagnostics', () => {
  const { execFileSync } = require('child_process');
  const cliPath = path.resolve(__dirname, '../bin/cli.js');

  fs.mkdirSync(TEST_DOCTOR_DIR, { recursive: true });
  fs.writeFileSync(path.join(TEST_DOCTOR_DIR, 'fogoe.config.json'), JSON.stringify({
    defaults: { runtime: 'express', language: 'js', database: 'none' }
  }));
  fs.writeFileSync(path.join(TEST_DOCTOR_DIR, 'package.json'), JSON.stringify({
    name: 'cli-test-app',
    dependencies: { express: '^4.19.0' },
    scripts: { dev: 'nodemon src/server.js', start: 'node src/server.js' }
  }));

  const stdout = execFileSync(process.execPath, [cliPath, 'doctor', '--json'], {
    cwd: TEST_DOCTOR_DIR,
    encoding: 'utf8',
  });

  const parsed = JSON.parse(stdout);
  assert.strictEqual(parsed.mode, 'diagnose');
  assert.ok(Array.isArray(parsed.checks));
  assert.ok(parsed.stats);
  assert.strictEqual(typeof parsed.stats.passed, 'number');
});

test('Doctor CLI Integration: node bin/cli.js doctor --fix --yes --json applies repairs headlessly', () => {
  const { execFileSync } = require('child_process');
  const cliPath = path.resolve(__dirname, '../bin/cli.js');

  fs.mkdirSync(TEST_DOCTOR_DIR, { recursive: true });
  fs.writeFileSync(path.join(TEST_DOCTOR_DIR, 'fogoe.config.json'), JSON.stringify({
    defaults: { runtime: 'express', language: 'js', database: 'none' }
  }));
  fs.writeFileSync(path.join(TEST_DOCTOR_DIR, 'package.json'), JSON.stringify({
    name: 'cli-fix-test-app',
    dependencies: { express: '^4.19.0' },
    scripts: {}
  }));
  // Mock node_modules to avoid triggering real npm install during integration test
  fs.mkdirSync(path.join(TEST_DOCTOR_DIR, 'node_modules'), { recursive: true });
  fs.writeFileSync(path.join(TEST_DOCTOR_DIR, 'node_modules', '.placeholder'), 'mock');

  const stdout = execFileSync(process.execPath, [cliPath, 'doctor', '--fix', '--yes', '--json'], {
    cwd: TEST_DOCTOR_DIR,
    encoding: 'utf8',
  });

  const parsed = JSON.parse(stdout);
  assert.strictEqual(parsed.mode, 'fix');
  assert.ok(Array.isArray(parsed.appliedRepairs));
  assert.ok(parsed.appliedRepairs.length > 0);

  // Verify repaired files
  assert.ok(fs.existsSync(path.join(TEST_DOCTOR_DIR, '.gitignore')));
  assert.ok(fs.existsSync(path.join(TEST_DOCTOR_DIR, '.env')));
  const pkg = JSON.parse(fs.readFileSync(path.join(TEST_DOCTOR_DIR, 'package.json'), 'utf8'));
  assert.ok(pkg.scripts.dev);
  assert.ok(pkg.scripts.start);
});

