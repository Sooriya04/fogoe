const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const { generateGitHubActionsWorkflow } = require('../src/ci/githubActions');
const { generateDockerfile, generateDockerignore } = require('../src/ci/docker');
const { DEPLOY_TARGETS, isValidDeployTarget, getRequiredSecrets } = require('../src/ci/deploy');
const { detectProjectStack, setupCiCd } = require('../src/ci');

const TEST_CI_DIR = path.join(__dirname, 'temp_ci_test');

function cleanTemp() {
  if (fs.existsSync(TEST_CI_DIR)) {
    fs.rmSync(TEST_CI_DIR, { recursive: true, force: true });
  }
}

test.beforeEach(cleanTemp);
test.after(cleanTemp);

test('GitHub Actions: npm JavaScript workflow with testing and linting', () => {
  const yaml = generateGitHubActionsWorkflow({
    name: 'CI Pipeline',
    language: 'javascript',
    pm: 'npm',
    testing: true,
    linting: true,
    docker: false,
    deploy: 'none',
  });

  assert.ok(yaml.includes('name: CI Pipeline'));
  assert.ok(yaml.includes('npm ci || npm install'));
  assert.ok(yaml.includes('npm run lint'));
  assert.ok(yaml.includes('npm test'));
  assert.strictEqual(yaml.includes('npm run build'), false, 'Should not compile build for JS');
});

test('GitHub Actions: pnpm TypeScript workflow with build and DockerHub deployment', () => {
  const yaml = generateGitHubActionsWorkflow({
    name: 'CI/CD Pipeline',
    language: 'typescript',
    pm: 'pnpm',
    testing: true,
    linting: true,
    docker: true,
    deploy: 'dockerhub',
  });

  assert.ok(yaml.includes('uses: pnpm/action-setup@v4'));
  assert.ok(yaml.includes('pnpm install --frozen-lockfile'));
  assert.ok(yaml.includes('pnpm run lint'));
  assert.ok(yaml.includes('pnpm test'));
  assert.ok(yaml.includes('pnpm run build'));
  assert.ok(yaml.includes('deploy-dockerhub:'));
  assert.ok(yaml.includes('secrets.DOCKERHUB_USERNAME'));
  assert.ok(yaml.includes('secrets.DOCKERHUB_TOKEN'));
});

test('GitHub Actions: Bun runtime with Fly.io deployment', () => {
  const yaml = generateGitHubActionsWorkflow({
    name: 'Fly Deploy Pipeline',
    language: 'typescript',
    pm: 'bun',
    testing: true,
    deploy: 'fly',
  });

  assert.ok(yaml.includes('uses: oven-sh/setup-bun@v2'));
  assert.ok(yaml.includes('bun install'));
  assert.ok(yaml.includes('bun test'));
  assert.ok(yaml.includes('deploy-fly:'));
  assert.ok(yaml.includes('FLY_API_TOKEN'));
});

test('GitHub Actions: Railway and Render deployment configurations', () => {
  const railwayYaml = generateGitHubActionsWorkflow({ deploy: 'railway' });
  assert.ok(railwayYaml.includes('deploy-railway:'));
  assert.ok(railwayYaml.includes('RAILWAY_TOKEN'));

  const renderYaml = generateGitHubActionsWorkflow({ deploy: 'render' });
  assert.ok(renderYaml.includes('deploy-render:'));
  assert.ok(renderYaml.includes('RENDER_DEPLOY_HOOK_URL'));
});

test('Docker Generator: Node.js multi-stage Dockerfile for TypeScript & pnpm', () => {
  const dockerfile = generateDockerfile({
    language: 'typescript',
    pm: 'pnpm',
    port: '4000',
  });

  assert.ok(dockerfile.includes('FROM node:20-alpine AS base'));
  assert.ok(dockerfile.includes('corepack prepare pnpm@latest --activate'));
  assert.ok(dockerfile.includes('pnpm run build'));
  assert.ok(dockerfile.includes('ENV PORT=4000'));
  assert.ok(dockerfile.includes('EXPOSE 4000'));
  assert.ok(dockerfile.includes('CMD ["node", "dist/server.js"]'));
});

test('Docker Generator: Bun Dockerfile for JavaScript', () => {
  const dockerfile = generateDockerfile({
    language: 'javascript',
    pm: 'bun',
    port: '3000',
  });

  assert.ok(dockerfile.includes('FROM oven/bun:1-alpine AS base'));
  assert.ok(dockerfile.includes('bun install'));
  assert.ok(dockerfile.includes('CMD ["bun", "run", "start"]'));
});

test('Docker Generator: .dockerignore contains essential ignore rules', () => {
  const dockerignore = generateDockerignore();
  assert.ok(dockerignore.includes('node_modules'));
  assert.ok(dockerignore.includes('.env'));
  assert.ok(dockerignore.includes('.git'));
  assert.ok(dockerignore.includes('dist'));
});

test('Deploy Targets: metadata validation and required secrets', () => {
  assert.strictEqual(isValidDeployTarget('dockerhub'), true);
  assert.strictEqual(isValidDeployTarget('fly'), true);
  assert.strictEqual(isValidDeployTarget('railway'), true);
  assert.strictEqual(isValidDeployTarget('render'), true);
  assert.strictEqual(isValidDeployTarget('unknown_cloud'), false);

  assert.deepStrictEqual(getRequiredSecrets('fly'), ['FLY_API_TOKEN']);
  assert.deepStrictEqual(getRequiredSecrets('railway'), ['RAILWAY_TOKEN', 'RAILWAY_SERVICE_NAME']);
  assert.deepStrictEqual(getRequiredSecrets('none'), []);
});

test('setupCiCd: Orchestrates complete CI/CD and Docker files cleanly', async () => {
  fs.mkdirSync(TEST_CI_DIR, { recursive: true });
  fs.writeFileSync(
    path.join(TEST_CI_DIR, 'fogoe.config.json'),
    JSON.stringify({
      defaults: {
        language: 'ts',
        runtime: 'fastify',
        type: 'esm',
        arch: 'mvc',
      },
    }, null, 2)
  );

  const res = await setupCiCd({
    targetDir: TEST_CI_DIR,
    ci: true,
    docker: true,
    deploy: 'fly',
    isNonInteractive: true,
    silent: true,
  });

  assert.strictEqual(res.configured, true);
  assert.strictEqual(res.ci, true);
  assert.strictEqual(res.docker, true);
  assert.strictEqual(res.deploy, 'fly');

  assert.ok(fs.existsSync(path.join(TEST_CI_DIR, '.github/workflows/ci.yml')));
  assert.ok(fs.existsSync(path.join(TEST_CI_DIR, 'Dockerfile')));
  assert.ok(fs.existsSync(path.join(TEST_CI_DIR, '.dockerignore')));

  const cfg = JSON.parse(fs.readFileSync(path.join(TEST_CI_DIR, 'fogoe.config.json'), 'utf8'));
  assert.ok(cfg.addons.includes('ci'));
  assert.ok(cfg.addons.includes('docker'));
});

test('Docker Generator: Debian Slim distribution', () => {
  const dockerfile = generateDockerfile({
    language: 'typescript',
    pm: 'npm',
    os: 'debian',
  });

  assert.ok(dockerfile.includes('FROM node:20-slim AS base'));
  assert.ok(dockerfile.includes('groupadd --system --gid 1001 nodejs'));
  assert.ok(dockerfile.includes('useradd --system --uid 1001 -g nodejs fogoe'));
  assert.ok(dockerfile.includes('HEALTHCHECK'));
});

test('Docker Generator: Ubuntu distribution', () => {
  const dockerfile = generateDockerfile({
    language: 'javascript',
    pm: 'npm',
    os: 'ubuntu',
  });

  assert.ok(dockerfile.includes('FROM node:20 AS base'));
  assert.ok(dockerfile.includes('groupadd --system --gid 1001 nodejs'));
});

test('Docker Generator: Google Distroless distribution', () => {
  const dockerfile = generateDockerfile({
    language: 'typescript',
    pm: 'pnpm',
    os: 'distroless',
  });

  assert.ok(dockerfile.includes('FROM gcr.io/distroless/nodejs20-debian12 AS runner'));
  assert.ok(dockerfile.includes('USER nonroot'));
  assert.ok(dockerfile.includes('CMD ["dist/server.js"]'));
});

test('Docker Generator: Development Dockerfile with hot reload', () => {
  const { generateDevDockerfile } = require('../src/ci/docker');
  const devDoc = generateDevDockerfile({
    language: 'typescript',
    pm: 'npm',
    os: 'alpine',
  });

  assert.ok(devDoc.includes('ENV NODE_ENV=development'));
  assert.ok(devDoc.includes('CMD ["npm", "run", "dev"]'));
});

test('Docker Compose: Generates complete stack for PostgreSQL and Redis', () => {
  const { generateDockerCompose } = require('../src/ci/compose');
  const compose = generateDockerCompose({
    name: 'store-api',
    port: '4000',
    database: 'postgres',
    redis: true,
  });

  assert.ok(compose.includes('container_name: store-api'));
  assert.ok(compose.includes('image: postgres:16-alpine'));
  assert.ok(compose.includes('image: redis:7-alpine'));
  assert.ok(compose.includes('DATABASE_URL=postgresql://fogoe:fogoe_password@db:5432/fogoe_db'));
  assert.ok(compose.includes('REDIS_URL=redis://redis:6379'));
  assert.ok(compose.includes('postgres_data:'));
  assert.ok(compose.includes('redis_data:'));
});

test('Docker Compose: Generates stack for MongoDB', () => {
  const { generateDockerCompose } = require('../src/ci/compose');
  const compose = generateDockerCompose({
    name: 'mongo-service',
    port: '3000',
    database: 'mongodb',
    redis: false,
  });

  assert.ok(compose.includes('image: mongo:7-jammy'));
  assert.ok(compose.includes('DATABASE_URL=mongodb://fogoe:fogoe_password@db:27017/fogoe_db?authSource=admin'));
  assert.ok(compose.includes('mongo_data:'));
  assert.strictEqual(compose.includes('redis:'), false);
});

test('Plugins Registry: ci, docker, and compose are registered as special delegation plugins', () => {
  const { PLUGINS } = require('../src/plugins/registry');
  assert.ok(PLUGINS.ci, 'PLUGINS.ci should exist');
  assert.strictEqual(PLUGINS.ci.isSpecial, true);
  assert.ok(PLUGINS.docker, 'PLUGINS.docker should exist');
  assert.strictEqual(PLUGINS.docker.isSpecial, true);
  assert.ok(PLUGINS.compose, 'PLUGINS.compose should exist');
  assert.strictEqual(PLUGINS.compose.isSpecial, true);
  assert.ok(PLUGINS['docker-compose'], 'PLUGINS.docker-compose should exist');
  assert.strictEqual(PLUGINS['docker-compose'].isSpecial, true);
});

test('Docker Generator: Handles null, empty options, and invalid OS gracefully', () => {
  const { generateDockerfile, normalizeDockerOs } = require('../src/ci/docker');

  const dockerDefault = generateDockerfile(null);
  assert.ok(dockerDefault.includes('node:20-alpine'));

  const dockerEmpty = generateDockerfile({});
  assert.ok(dockerEmpty.includes('node:20-alpine'));

  const dockerInvalid = generateDockerfile({ os: 'unknown_bsd_os' });
  assert.ok(dockerInvalid.includes('node:20-alpine'));

  assert.strictEqual(normalizeDockerOs('  DEBIAN-slim '), 'debian');
  assert.strictEqual(normalizeDockerOs('UBUNTU'), 'ubuntu');
  assert.strictEqual(normalizeDockerOs('distroless'), 'distroless');
});

test('Docker Generator: Bun with Ubuntu distribution uses oven/bun:1', () => {
  const { generateDockerfile, generateDevDockerfile } = require('../src/ci/docker');

  const prodDocker = generateDockerfile({ pm: 'bun', os: 'ubuntu' });
  assert.ok(prodDocker.includes('FROM oven/bun:1 AS base'));

  const devDocker = generateDevDockerfile({ pm: 'bun', os: 'ubuntu' });
  assert.ok(devDocker.includes('FROM oven/bun:1'));
});

test('Docker Generator: Distroless with JavaScript and custom port', () => {
  const { generateDockerfile } = require('../src/ci/docker');

  const dockerfile = generateDockerfile({
    language: 'javascript',
    pm: 'npm',
    os: 'distroless',
    port: 8080,
  });

  assert.ok(dockerfile.includes('ENV PORT=8080'));
  assert.ok(dockerfile.includes('EXPOSE 8080'));
  assert.ok(dockerfile.includes('USER nonroot'));
  assert.ok(dockerfile.includes('CMD ["src/server.js"]'));
  assert.strictEqual(dockerfile.includes('AS builder'), false, 'JS should not have builder stage in distroless');
});

test('Docker Generator: Development Dockerfile with pnpm and yarn', () => {
  const { generateDevDockerfile } = require('../src/ci/docker');

  const pnpmDocker = generateDevDockerfile({ pm: 'pnpm' });
  assert.ok(pnpmDocker.includes('CMD ["pnpm", "run", "dev"]'));

  const yarnDocker = generateDevDockerfile({ pm: 'yarn' });
  assert.ok(yarnDocker.includes('CMD ["yarn", "run", "dev"]'));
});

test('Docker Compose: Sanitizes service names with spaces and special characters', () => {
  const { generateDockerCompose } = require('../src/ci/compose');

  const compose = generateDockerCompose({
    name: 'My Awesome Service!!',
    database: 'postgres',
    redis: true,
  });

  assert.ok(compose.includes('container_name: my-awesome-service'));
  assert.ok(compose.includes('container_name: my-awesome-service-db'));
  assert.ok(compose.includes('container_name: my-awesome-service-redis'));
});

test('Docker Compose: MySQL and MongoDB include healthchecks and app conditions', () => {
  const { generateDockerCompose } = require('../src/ci/compose');

  const mysqlCompose = generateDockerCompose({ database: 'mysql' });
  assert.ok(mysqlCompose.includes('mysqladmin'));
  assert.ok(mysqlCompose.includes('condition: service_healthy'));

  const mongoCompose = generateDockerCompose({ database: 'mongodb' });
  assert.ok(mongoCompose.includes('mongosh'));
  assert.ok(mongoCompose.includes('condition: service_healthy'));
});

test('Docker Compose: Handles SQLite and none databases without empty YAML blocks', () => {
  const { generateDockerCompose } = require('../src/ci/compose');

  const sqliteCompose = generateDockerCompose({ database: 'sqlite' });
  assert.strictEqual(sqliteCompose.includes('db:'), false);
  assert.strictEqual(sqliteCompose.includes('depends_on:'), false);
  assert.strictEqual(sqliteCompose.includes('volumes:'), false);

  const noneCompose = generateDockerCompose({ database: 'none', redis: false });
  assert.strictEqual(noneCompose.includes('depends_on:'), false);
  assert.strictEqual(noneCompose.includes('volumes:'), false);
  assert.ok(noneCompose.includes('services:'));
  assert.ok(noneCompose.includes('app:'));
});

test('Docker Compose: setupCompose inspects package.json dependencies as fallback', async () => {
  const { setupCompose } = require('../src/ci/compose');

  fs.mkdirSync(TEST_CI_DIR, { recursive: true });
  fs.writeFileSync(
    path.join(TEST_CI_DIR, 'package.json'),
    JSON.stringify({
      name: 'fallback-pkg-service',
      dependencies: {
        pg: '^8.11.0',
        ioredis: '^5.3.0',
      },
    }, null, 2)
  );
  fs.writeFileSync(path.join(TEST_CI_DIR, '.env'), 'PORT=5000\n');

  await setupCompose({ targetDir: TEST_CI_DIR, silent: true });

  const compose = fs.readFileSync(path.join(TEST_CI_DIR, 'docker-compose.yml'), 'utf8');
  assert.ok(compose.includes('container_name: fallback-pkg-service'));
  assert.ok(compose.includes('"5000:5000"'));
  assert.ok(compose.includes('postgres:16-alpine'));
  assert.ok(compose.includes('redis:7-alpine'));
});

test('Docker Compose: setupCompose avoids duplicate compose in addons array', async () => {
  const { setupCompose } = require('../src/ci/compose');

  fs.mkdirSync(TEST_CI_DIR, { recursive: true });
  fs.writeFileSync(
    path.join(TEST_CI_DIR, 'fogoe.config.json'),
    JSON.stringify({
      name: 'unique-addon-test',
      addons: ['compose'],
    }, null, 2)
  );

  await setupCompose({ targetDir: TEST_CI_DIR, silent: true });

  const cfg = JSON.parse(fs.readFileSync(path.join(TEST_CI_DIR, 'fogoe.config.json'), 'utf8'));
  const occurrences = cfg.addons.filter(a => a === 'compose').length;
  assert.strictEqual(occurrences, 1, 'Should not duplicate compose in addons');
});
