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

test('CLI generate: crud vertical slice (model, controller, routes)', () => {
  if (fs.existsSync(TEST_OUTPUT_DIR)) {
    fs.rmSync(TEST_OUTPUT_DIR, { recursive: true, force: true });
  }

  composeProject({
    targetDir: TEST_OUTPUT_DIR,
    name: 'test-crud-app',
    language: 'javascript',
    runtime: 'express',
    type: 'commonjs',
    architecture: 'mvc',
    database: 'mongodb',
    hashing: 'bcrypt',
  });

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

    generateComponent('crud', 'product');

    const routePath = path.join(TEST_OUTPUT_DIR, 'src/routes/product.js');
    const controllerPath = path.join(TEST_OUTPUT_DIR, 'src/controllers/productcontroller.js');
    const modelPath = path.join(TEST_OUTPUT_DIR, 'src/models/product.js');

    assert.ok(fs.existsSync(routePath), 'CRUD route must exist');
    assert.ok(fs.existsSync(controllerPath), 'CRUD controller must exist');
    assert.ok(fs.existsSync(modelPath), 'CRUD model must exist');

    // Syntax validation
    execSync(`node --check "${routePath}"`);
    execSync(`node --check "${controllerPath}"`);
    execSync(`node --check "${modelPath}"`);

    // Verify CRUD methods
    const controllerContent = fs.readFileSync(controllerPath, 'utf8');
    assert.ok(controllerContent.includes('getAll'), 'Controller must have getAll');
    assert.ok(controllerContent.includes('getById'), 'Controller must have getById');
    assert.ok(controllerContent.includes('create'), 'Controller must have create');
    assert.ok(controllerContent.includes('update'), 'Controller must have update');
    assert.ok(controllerContent.includes('remove'), 'Controller must have remove');

    const routeContent = fs.readFileSync(routePath, 'utf8');
    assert.ok(routeContent.includes("router.get('/',"), 'Route must handle GET /');
    assert.ok(routeContent.includes("router.get('/:id',"), 'Route must handle GET /:id');
    assert.ok(routeContent.includes("router.post('/',"), 'Route must handle POST /');
    assert.ok(routeContent.includes("router.put('/:id',"), 'Route must handle PUT /:id');
    assert.ok(routeContent.includes("router.delete('/:id',"), 'Route must handle DELETE /:id');
  } finally {
    process.chdir(prevCwd);
    if (fs.existsSync(TEST_OUTPUT_DIR)) {
      fs.rmSync(TEST_OUTPUT_DIR, { recursive: true, force: true });
    }
  }
});

test('CLI generate: crud vertical slice with Drizzle ORM in TypeScript MVC', () => {
  if (fs.existsSync(TEST_OUTPUT_DIR)) {
    fs.rmSync(TEST_OUTPUT_DIR, { recursive: true, force: true });
  }

  composeProject({
    targetDir: TEST_OUTPUT_DIR,
    name: 'test-drizzle-crud-app',
    language: 'typescript',
    runtime: 'express',
    type: 'module',
    architecture: 'mvc',
    database: 'drizzle',
    hashing: 'bcrypt',
  });

  fs.writeFileSync(
    path.join(TEST_OUTPUT_DIR, 'fogoe.config.json'),
    JSON.stringify({
      defaults: {
        language: 'ts',
        arch: 'mvc',
        runtime: 'express',
        type: 'esm',
        database: 'drizzle',
      }
    }, null, 2)
  );

  const prevCwd = process.cwd();
  try {
    process.chdir(TEST_OUTPUT_DIR);

    generateComponent('crud', 'post');

    const routePath = path.join(TEST_OUTPUT_DIR, 'src/routes/post.ts');
    const controllerPath = path.join(TEST_OUTPUT_DIR, 'src/controllers/postcontroller.ts');
    const modelPath = path.join(TEST_OUTPUT_DIR, 'src/models/post.ts');

    assert.ok(fs.existsSync(routePath), 'CRUD route must exist');
    assert.ok(fs.existsSync(controllerPath), 'CRUD controller must exist');
    assert.ok(fs.existsSync(modelPath), 'CRUD model must exist');

    const modelContent = fs.readFileSync(modelPath, 'utf8');
    assert.ok(modelContent.includes('drizzle-orm/pg-core'), 'Drizzle model should import pgTable');
    assert.ok(modelContent.includes('pgTable'), 'Drizzle model should define pgTable');
    assert.ok(modelContent.includes('posts'), 'Drizzle model should define posts table');

    const controllerContent = fs.readFileSync(controllerPath, 'utf8');
    assert.ok(controllerContent.includes('export async function getAll'), 'Controller should export getAll');
    assert.ok(controllerContent.includes('export async function getById'), 'Controller should export getById');
    assert.ok(controllerContent.includes('export async function create'), 'Controller should export create');
    assert.ok(controllerContent.includes('export async function update'), 'Controller should export update');
    assert.ok(controllerContent.includes('export async function remove'), 'Controller should export remove');

    const routeContent = fs.readFileSync(routePath, 'utf8');
    assert.ok(routeContent.includes("router.get('/', getAll);"), 'Route should mount getAll');
    assert.ok(routeContent.includes("router.delete('/:id', remove);"), 'Route should mount remove');
  } finally {
    process.chdir(prevCwd);
    if (fs.existsSync(TEST_OUTPUT_DIR)) {
      fs.rmSync(TEST_OUTPUT_DIR, { recursive: true, force: true });
    }
  }
});


