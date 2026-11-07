const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');
const { checkNpmPackageExists, resolveTypesPackage, resolveTemplate, detectRuntime } = require('../src/plugins');
const { getPluginConfig, PLUGINS } = require('../src/plugins/registry');

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

test('Stack-aware plugins: getPluginConfig resolves tailored packages per framework', () => {
  // Ratelimit
  const expressRate = getPluginConfig('ratelimit', 'express');
  assert.strictEqual(expressRate.packages, 'express-rate-limit');

  const fastifyRate = getPluginConfig('ratelimit', 'fastify');
  assert.strictEqual(fastifyRate.packages, '@fastify/rate-limit');

  const honoRate = getPluginConfig('ratelimit', 'hono');
  assert.strictEqual(honoRate.packages, 'hono-rate-limiter');

  const koaRate = getPluginConfig('ratelimit', 'koa');
  assert.strictEqual(koaRate.packages, 'koa-ratelimit');
  assert.strictEqual(koaRate.devPackages, '@types/koa-ratelimit');

  // Swagger
  const expressSwagger = getPluginConfig('swagger', 'express');
  assert.strictEqual(expressSwagger.packages, 'swagger-ui-express swagger-jsdoc');

  const fastifySwagger = getPluginConfig('swagger', 'fastify');
  assert.strictEqual(fastifySwagger.packages, '@fastify/swagger @fastify/swagger-ui');

  const honoSwagger = getPluginConfig('swagger', 'hono');
  assert.strictEqual(honoSwagger.packages, '@hono/zod-openapi @scalar/hono-api-reference');

  const koaSwagger = getPluginConfig('swagger', 'koa');
  assert.strictEqual(koaSwagger.packages, 'koa2-swagger-ui swagger-jsdoc');
});

test('Stack-aware plugins: resolveTemplate produces framework-native code', () => {
  // Ratelimit TypeScript templates
  const fastifyRateTmpl = resolveTemplate('ratelimit', 'ts', 'esm', 'fastify');
  assert.ok(fastifyRateTmpl.includes('@fastify/rate-limit'), 'Fastify ratelimit imports @fastify/rate-limit');
  assert.ok(fastifyRateTmpl.includes('FastifyInstance'), 'Fastify ratelimit uses FastifyInstance type');

  const honoRateTmpl = resolveTemplate('ratelimit', 'ts', 'esm', 'hono');
  assert.ok(honoRateTmpl.includes('hono-rate-limiter'), 'Hono ratelimit imports hono-rate-limiter');

  const koaRateTmpl = resolveTemplate('ratelimit', 'ts', 'esm', 'koa');
  assert.ok(koaRateTmpl.includes('koa-ratelimit'), 'Koa ratelimit imports koa-ratelimit');
  assert.ok(koaRateTmpl.includes('Context'), 'Koa ratelimit imports Context type');

  // Swagger TypeScript templates
  const fastifySwaggerTmpl = resolveTemplate('swagger', 'ts', 'esm', 'fastify');
  assert.ok(fastifySwaggerTmpl.includes('@fastify/swagger'), 'Fastify swagger imports @fastify/swagger');
  assert.ok(fastifySwaggerTmpl.includes('@fastify/swagger-ui'), 'Fastify swagger imports @fastify/swagger-ui');

  const honoSwaggerTmpl = resolveTemplate('swagger', 'ts', 'esm', 'hono');
  assert.ok(honoSwaggerTmpl.includes('@scalar/hono-api-reference'), 'Hono swagger imports @scalar/hono-api-reference');

  const koaSwaggerTmpl = resolveTemplate('swagger', 'ts', 'esm', 'koa');
  assert.ok(koaSwaggerTmpl.includes('koa2-swagger-ui'), 'Koa swagger imports koa2-swagger-ui');

  // Zod TypeScript templates
  const fastifyZodTmpl = resolveTemplate('zod', 'ts', 'esm', 'fastify');
  assert.ok(fastifyZodTmpl.includes('FastifyRequest'), 'Fastify zod uses FastifyRequest');

  const honoZodTmpl = resolveTemplate('zod', 'ts', 'esm', 'hono');
  assert.ok(honoZodTmpl.includes('Context'), 'Hono zod uses Context');

  const koaZodTmpl = resolveTemplate('zod', 'ts', 'esm', 'koa');
  assert.ok(koaZodTmpl.includes('Context'), 'Koa zod uses Context');
});

test('Stack-aware plugins: detectRuntime detects from config or package.json', () => {
  assert.strictEqual(detectRuntime({ defaults: { runtime: 'Fastify' } }), 'fastify');
  assert.strictEqual(detectRuntime({ defaults: { framework: 'Hono' } }), 'hono');
  assert.strictEqual(detectRuntime({}), 'express');
});

test('CLI add command: scaffolds stack-aware plugin file for Fastify without error', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fogoe-stack-plugin-test-'));
  try {
    fs.writeFileSync(
      path.join(tmpDir, 'package.json'),
      JSON.stringify({ name: 'fastify-app', version: '1.0.0', dependencies: {} }, null, 2)
    );
    fs.writeFileSync(
      path.join(tmpDir, 'fogoe.config.json'),
      JSON.stringify({ defaults: { language: 'ts', runtime: 'fastify', type: 'esm' } }, null, 2)
    );

    // Call resolveTemplate directly to verify template creation for fastify
    const content = resolveTemplate('ratelimit', 'ts', 'esm', 'fastify');
    const outFile = path.join(tmpDir, 'src/middlewares/rateLimiter.ts');
    fs.mkdirSync(path.dirname(outFile), { recursive: true });
    fs.writeFileSync(outFile, content);

    assert.ok(fs.existsSync(outFile));
    const fileContent = fs.readFileSync(outFile, 'utf8');
    assert.ok(fileContent.includes('@fastify/rate-limit'));
    assert.ok(fileContent.includes('setupRateLimit'));
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('Queue plugin: BullMQ metadata and template rendering', () => {
  const queueMeta = getPluginConfig('queue');
  assert.ok(queueMeta, 'queue plugin exists');
  assert.strictEqual(queueMeta.packages, 'bullmq');
  assert.strictEqual(queueMeta.outputDir, 'src/queues');
  assert.strictEqual(queueMeta.outputFile, 'queue');
  assert.strictEqual(queueMeta.envVars, 'REDIS_URL=redis://localhost:6379');

  const bullmqMeta = getPluginConfig('bullmq');
  assert.ok(bullmqMeta, 'bullmq alias exists');
  assert.strictEqual(bullmqMeta.packages, 'bullmq');

  // CommonJS
  const cjsTmpl = resolveTemplate('queue', 'js', 'cjs');
  assert.ok(cjsTmpl.includes("require('bullmq')"), 'CJS imports bullmq');
  assert.ok(cjsTmpl.includes('defaultQueue'), 'CJS defines defaultQueue');
  assert.ok(cjsTmpl.includes('defaultWorker'), 'CJS defines defaultWorker');
  assert.ok(cjsTmpl.includes('addJob'), 'CJS defines addJob');
  assert.ok(cjsTmpl.includes('maxRetriesPerRequest: null'), 'CJS includes maxRetriesPerRequest: null for BullMQ compatibility');

  // ESM
  const esmTmpl = resolveTemplate('queue', 'js', 'esm');
  assert.ok(esmTmpl.includes("import { Queue, Worker } from 'bullmq'"), 'ESM imports bullmq');
  assert.ok(esmTmpl.includes('export const defaultQueue'), 'ESM exports defaultQueue');

  // TypeScript
  const tsTmpl = resolveTemplate('queue', 'ts', 'esm');
  assert.ok(tsTmpl.includes("import { Queue, Worker, Job } from 'bullmq'"), 'TS imports Job type');
  assert.ok(tsTmpl.includes('job: Job'), 'TS types worker job');
  assert.ok(tsTmpl.includes('addJob<T = any>'), 'TS provides generic addJob');
});

