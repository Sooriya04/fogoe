const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const { execSync } = require('node:child_process');
const { composeProject } = require('../src/composer');

const TEST_OUTPUT_DIR = path.join(__dirname, 'temp_generated');

const [nodeMajor, nodeMinor] = process.versions.node.split('.').map(Number);
const supportsStripTypes = nodeMajor > 22 || (nodeMajor === 22 && nodeMinor >= 6);

function validateJsFile(filePath) {
  assert.ok(fs.existsSync(filePath), `File should exist: ${filePath}`);
  execSync(`node --check "${filePath}"`);
}

function validateTsFile(filePath) {
  assert.ok(fs.existsSync(filePath), `File should exist: ${filePath}`);
  const content = fs.readFileSync(filePath, 'utf8');
  assert.ok(content.trim().length > 0, `File should not be empty: ${filePath}`);

  if (supportsStripTypes) {
    execSync(`node --experimental-strip-types --check "${filePath}"`);
  }
}

function cleanTemp() {
  if (fs.existsSync(TEST_OUTPUT_DIR)) {
    fs.rmSync(TEST_OUTPUT_DIR, { recursive: true, force: true });
  }
}

test.beforeEach(cleanTemp);
test.after(cleanTemp);

test('Generator: Express + JavaScript Minimal', () => {
  const target = path.join(TEST_OUTPUT_DIR, 'express-js-min');
  composeProject({
    targetDir: target,
    name: 'test-express-js-min',
    language: 'javascript',
    runtime: 'express',
    type: 'commonjs',
    architecture: 'minimal',
  });

  validateJsFile(path.join(target, 'src/server.js'));
  assert.ok(fs.existsSync(path.join(target, '.gitignore')));
  assert.ok(fs.existsSync(path.join(target, '.env')));
  assert.ok(fs.existsSync(path.join(target, 'package.json')));
});

test('Generator: Express + JavaScript MVC with MongoDB + Bcrypt', () => {
  const target = path.join(TEST_OUTPUT_DIR, 'express-js-mvc');
  composeProject({
    targetDir: target,
    name: 'test-express-js-mvc',
    language: 'javascript',
    runtime: 'express',
    type: 'commonjs',
    architecture: 'mvc',
    database: 'mongodb',
    hashing: 'bcrypt',
    useJwt: false,
  });

  const files = [
    'src/server.js',
    'src/app.js',
    'src/routes/home.js',
    'src/controllers/homecontroller.js',
    'src/config/db.js',
    'src/models/model.js',
    'src/utils/hashing.js',
  ];
  for (const f of files) {
    validateJsFile(path.join(target, f));
  }
});

test('Generator: Express + JavaScript MVC with PostgreSQL + JWT', () => {
  const target = path.join(TEST_OUTPUT_DIR, 'express-js-jwt');
  composeProject({
    targetDir: target,
    name: 'test-express-js-jwt',
    language: 'javascript',
    runtime: 'express',
    type: 'commonjs',
    architecture: 'mvc',
    database: 'postgresql',
    hashing: 'bcrypt',
    useJwt: true,
  });

  validateJsFile(path.join(target, 'src/middlewares/authMiddleware.js'));
  validateJsFile(path.join(target, 'src/config/db.js'));

  const authContent = fs.readFileSync(path.join(target, 'src/middlewares/authMiddleware.js'), 'utf8');
  assert.ok(authContent.includes('authMiddleware'), 'Auth middleware function should be defined');
  assert.ok(authContent.includes('jwt.verify'), 'JWT verify should be called');
});

test('Generator: Fastify + JavaScript Minimal (Port as number)', () => {
  const target = path.join(TEST_OUTPUT_DIR, 'fastify-js-min');
  composeProject({
    targetDir: target,
    name: 'test-fastify-js-min',
    language: 'javascript',
    runtime: 'fastify',
    type: 'commonjs',
    architecture: 'minimal',
  });

  const serverContent = fs.readFileSync(path.join(target, 'src/server.js'), 'utf8');
  assert.ok(serverContent.includes('Number(process.env.PORT)'), 'Fastify port must be parsed as a number');

  validateJsFile(path.join(target, 'src/server.js'));
});

test('Generator: Express + TypeScript Minimal', () => {
  const target = path.join(TEST_OUTPUT_DIR, 'express-ts-min');
  composeProject({
    targetDir: target,
    name: 'test-express-ts-min',
    language: 'typescript',
    runtime: 'express',
    type: 'module',
    architecture: 'minimal',
  });

  validateTsFile(path.join(target, 'src/server.ts'));
  assert.ok(fs.existsSync(path.join(target, 'tsconfig.json')));

  const tsConfig = JSON.parse(fs.readFileSync(path.join(target, 'tsconfig.json'), 'utf8'));
  assert.strictEqual(tsConfig.compilerOptions.moduleResolution, 'NodeNext');
});

test('Generator: Express + TypeScript MVC with SQLite', () => {
  const target = path.join(TEST_OUTPUT_DIR, 'express-ts-mvc-sqlite');
  composeProject({
    targetDir: target,
    name: 'test-express-ts-mvc-sqlite',
    language: 'typescript',
    runtime: 'express',
    type: 'module',
    architecture: 'mvc',
    database: 'sqlite',
    hashing: 'argon2',
    useJwt: true,
    testing: true,
    linting: true,
  });

  const tsFiles = [
    'src/server.ts',
    'src/app.ts',
    'src/routes/home.ts',
    'src/controllers/homecontroller.ts',
    'src/config/db.ts',
    'src/utils/hashing.ts',
    'src/middlewares/authMiddleware.ts',
    'src/__tests__/app.test.ts'
  ];
  for (const f of tsFiles) {
    validateTsFile(path.join(target, f));
  }

  assert.ok(fs.existsSync(path.join(target, '.eslintrc.json')));
  assert.ok(fs.existsSync(path.join(target, '.prettierrc')));

  const tsConfig = JSON.parse(fs.readFileSync(path.join(target, 'tsconfig.json'), 'utf8'));
  for (const [alias, paths] of Object.entries(tsConfig.compilerOptions.paths)) {
    for (const p of paths) {
      assert.ok(p.startsWith('./'), `Path for ${alias} must start with ./ : ${p}`);
    }
  }
});

test('Generator: Fastify + TypeScript MVC with Prisma', () => {
  const target = path.join(TEST_OUTPUT_DIR, 'fastify-ts-mvc');
  composeProject({
    targetDir: target,
    name: 'test-fastify-ts-mvc',
    language: 'typescript',
    runtime: 'fastify',
    type: 'module',
    architecture: 'mvc',
    database: 'prisma',
    hashing: 'bcrypt',
    useJwt: true,
  });

  assert.ok(fs.existsSync(path.join(target, 'prisma/schema.prisma')));

  const tsFiles = [
    'src/server.ts',
    'src/app.ts',
    'src/routes/home.ts',
    'src/controllers/homecontroller.ts',
    'src/config/db.ts',
    'src/middlewares/authMiddleware.ts'
  ];
  for (const f of tsFiles) {
    validateTsFile(path.join(target, f));
  }
});

test('Generator: Hono + TypeScript MVC', () => {
  const target = path.join(TEST_OUTPUT_DIR, 'hono-ts-mvc');
  composeProject({
    targetDir: target,
    name: 'test-hono-ts-mvc',
    language: 'typescript',
    runtime: 'hono',
    type: 'module',
    architecture: 'mvc',
    database: 'none',
    hashing: 'crypto',
    useJwt: false,
  });

  validateTsFile(path.join(target, 'src/server.ts'));
  validateTsFile(path.join(target, 'src/app.ts'));
});

test('Generator: Koa + TypeScript MVC', () => {
  const target = path.join(TEST_OUTPUT_DIR, 'koa-ts-mvc');
  composeProject({
    targetDir: target,
    name: 'test-koa-ts-mvc',
    language: 'typescript',
    runtime: 'koa',
    type: 'module',
    architecture: 'mvc',
    database: 'mysql',
    hashing: 'bcrypt',
    useJwt: true,
  });

  validateTsFile(path.join(target, 'src/server.ts'));
  validateTsFile(path.join(target, 'src/app.ts'));
  validateTsFile(path.join(target, 'src/config/db.ts'));
});

test('Generator: .gitignore is always present with dist and .env', () => {
  const target = path.join(TEST_OUTPUT_DIR, 'gitignore-check');
  composeProject({
    targetDir: target,
    name: 'gitignore-check',
    language: 'typescript',
    runtime: 'koa',
    type: 'commonjs',
    architecture: 'minimal',
  });

  const gitignore = fs.readFileSync(path.join(target, '.gitignore'), 'utf8');
  assert.ok(gitignore.includes('node_modules/'));
  assert.ok(gitignore.includes('.env'));
  assert.ok(gitignore.includes('dist/'));
});

test('Generator: vitest template is copied as app.test.ts without .tpl extension', () => {
  const target = path.join(TEST_OUTPUT_DIR, 'vitest-check');
  composeProject({
    targetDir: target,
    name: 'vitest-check',
    language: 'typescript',
    runtime: 'express',
    type: 'module',
    architecture: 'minimal',
    testing: true,
  });

  const testFile = path.join(target, 'src/__tests__/app.test.ts');
  assert.ok(fs.existsSync(testFile), 'app.test.ts should exist');
  assert.ok(!fs.existsSync(path.join(target, 'src/__tests__/app.test.ts.tpl')), '.tpl should be stripped');
});
