const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { resolveTemplate, detectRuntime } = require('../src/plugins');
const { getPluginConfig } = require('../src/plugins/registry');

test('Stack-aware plugins: getPluginConfig packages across all 4 runtimes', () => {
  // ── Ratelimit ─────────────────────────────────────────────────────────────
  const expressRate = getPluginConfig('ratelimit', 'express');
  assert.strictEqual(expressRate.packages, 'express-rate-limit');
  assert.strictEqual(expressRate.devPackages, '');
  assert.strictEqual(expressRate.outputDir, 'src/middlewares');
  assert.strictEqual(expressRate.outputFile, 'rateLimiter');

  const fastifyRate = getPluginConfig('ratelimit', 'fastify');
  assert.strictEqual(fastifyRate.packages, '@fastify/rate-limit');
  assert.strictEqual(fastifyRate.devPackages, '');

  const honoRate = getPluginConfig('ratelimit', 'hono');
  assert.strictEqual(honoRate.packages, 'hono-rate-limiter');
  assert.strictEqual(honoRate.devPackages, '');

  const koaRate = getPluginConfig('ratelimit', 'koa');
  assert.strictEqual(koaRate.packages, 'koa-ratelimit');
  assert.strictEqual(koaRate.devPackages, '@types/koa-ratelimit');

  // ── Swagger ───────────────────────────────────────────────────────────────
  const expressSwagger = getPluginConfig('swagger', 'express');
  assert.strictEqual(expressSwagger.packages, 'swagger-ui-express swagger-jsdoc');
  assert.strictEqual(expressSwagger.devPackages, '@types/swagger-ui-express @types/swagger-jsdoc');
  assert.strictEqual(expressSwagger.outputDir, 'src/config');
  assert.strictEqual(expressSwagger.outputFile, 'swagger');

  const fastifySwagger = getPluginConfig('swagger', 'fastify');
  assert.strictEqual(fastifySwagger.packages, '@fastify/swagger @fastify/swagger-ui');
  assert.strictEqual(fastifySwagger.devPackages, '');

  const honoSwagger = getPluginConfig('swagger', 'hono');
  assert.strictEqual(honoSwagger.packages, '@hono/zod-openapi @scalar/hono-api-reference');
  assert.strictEqual(honoSwagger.devPackages, '');

  const koaSwagger = getPluginConfig('swagger', 'koa');
  assert.strictEqual(koaSwagger.packages, 'koa2-swagger-ui swagger-jsdoc');
  assert.strictEqual(koaSwagger.devPackages, '@types/swagger-jsdoc');

  // ── Defaults & Case Insensitivity ─────────────────────────────────────────
  const upperFastify = getPluginConfig('ratelimit', 'FASTIFY');
  assert.strictEqual(upperFastify.packages, '@fastify/rate-limit');

  const fallbackExpress = getPluginConfig('ratelimit', 'unknown-runtime');
  assert.strictEqual(fallbackExpress.packages, 'express-rate-limit');
});

test('Stack-aware plugins: ratelimit template output matches framework idioms', () => {
  // Express (CJS, ESM, TS)
  const expressCjs = resolveTemplate('ratelimit', 'js', 'cjs', 'express');
  assert.ok(expressCjs.includes("require('express-rate-limit')"), 'Express CJS requires express-rate-limit');
  assert.ok(expressCjs.includes('module.exports = limiter'), 'Express CJS exports limiter');

  const expressEsm = resolveTemplate('ratelimit', 'js', 'esm', 'express');
  assert.ok(expressEsm.includes("import rateLimit from 'express-rate-limit'"), 'Express ESM imports express-rate-limit');
  assert.ok(expressEsm.includes('export default limiter'), 'Express ESM exports default limiter');

  const expressTs = resolveTemplate('ratelimit', 'ts', 'esm', 'express');
  assert.ok(expressTs.includes("import rateLimit from 'express-rate-limit'"), 'Express TS imports express-rate-limit');

  // Fastify (CJS, ESM, TS)
  const fastifyCjs = resolveTemplate('ratelimit', 'js', 'cjs', 'fastify');
  assert.ok(fastifyCjs.includes("require('@fastify/rate-limit')"), 'Fastify CJS requires @fastify/rate-limit');
  assert.ok(fastifyCjs.includes('fastify.register(rateLimit'), 'Fastify CJS registers plugin');

  const fastifyEsm = resolveTemplate('ratelimit', 'js', 'esm', 'fastify');
  assert.ok(fastifyEsm.includes("import rateLimit from '@fastify/rate-limit'"), 'Fastify ESM imports @fastify/rate-limit');
  assert.ok(fastifyEsm.includes('export default async function setupRateLimit'), 'Fastify ESM exports async setup function');

  const fastifyTs = resolveTemplate('ratelimit', 'ts', 'esm', 'fastify');
  assert.ok(fastifyTs.includes("import { FastifyInstance } from 'fastify'"), 'Fastify TS imports FastifyInstance');
  assert.ok(fastifyTs.includes('fastify: FastifyInstance'), 'Fastify TS types fastify parameter');

  // Hono (CJS, ESM, TS)
  const honoCjs = resolveTemplate('ratelimit', 'js', 'cjs', 'hono');
  assert.ok(honoCjs.includes("require('hono-rate-limiter')"), 'Hono CJS requires hono-rate-limiter');

  const honoEsm = resolveTemplate('ratelimit', 'js', 'esm', 'hono');
  assert.ok(honoEsm.includes("import { rateLimiter } from 'hono-rate-limiter'"), 'Hono ESM imports rateLimiter');

  const honoTs = resolveTemplate('ratelimit', 'ts', 'esm', 'hono');
  assert.ok(honoTs.includes("export const limiter = rateLimiter"), 'Hono TS exports typed limiter');

  // Koa (CJS, ESM, TS)
  const koaCjs = resolveTemplate('ratelimit', 'js', 'cjs', 'koa');
  assert.ok(koaCjs.includes("require('koa-ratelimit')"), 'Koa CJS requires koa-ratelimit');
  assert.ok(koaCjs.includes("driver: 'memory'"), 'Koa CJS configures memory driver');

  const koaEsm = resolveTemplate('ratelimit', 'js', 'esm', 'koa');
  assert.ok(koaEsm.includes("import rateLimit from 'koa-ratelimit'"), 'Koa ESM imports koa-ratelimit');

  const koaTs = resolveTemplate('ratelimit', 'ts', 'esm', 'koa');
  assert.ok(koaTs.includes("import { Context } from 'koa'"), 'Koa TS imports Context');
  assert.ok(koaTs.includes('id: (ctx: Context)'), 'Koa TS types context parameter');
});

test('Stack-aware plugins: swagger template output matches framework idioms', () => {
  // Express (CJS, ESM, TS)
  const expressSwaggerCjs = resolveTemplate('swagger', 'js', 'cjs', 'express');
  assert.ok(expressSwaggerCjs.includes("require('swagger-ui-express')"), 'Express Swagger requires swagger-ui-express');
  assert.ok(expressSwaggerCjs.includes("require('swagger-jsdoc')"), 'Express Swagger requires swagger-jsdoc');

  const expressSwaggerTs = resolveTemplate('swagger', 'ts', 'esm', 'express');
  assert.ok(expressSwaggerTs.includes("import swaggerUi from 'swagger-ui-express'"), 'Express TS imports swagger-ui-express');

  // Fastify (CJS, ESM, TS)
  const fastifySwaggerCjs = resolveTemplate('swagger', 'js', 'cjs', 'fastify');
  assert.ok(fastifySwaggerCjs.includes("require('@fastify/swagger')"), 'Fastify Swagger requires @fastify/swagger');
  assert.ok(fastifySwaggerCjs.includes("require('@fastify/swagger-ui')"), 'Fastify Swagger requires @fastify/swagger-ui');

  const fastifySwaggerTs = resolveTemplate('swagger', 'ts', 'esm', 'fastify');
  assert.ok(fastifySwaggerTs.includes("import { FastifyInstance } from 'fastify'"), 'Fastify Swagger TS imports FastifyInstance');
  assert.ok(fastifySwaggerTs.includes("routePrefix: '/api-docs'"), 'Fastify Swagger sets /api-docs route prefix');

  // Hono (CJS, ESM, TS)
  const honoSwaggerCjs = resolveTemplate('swagger', 'js', 'cjs', 'hono');
  assert.ok(honoSwaggerCjs.includes("require('@scalar/hono-api-reference')"), 'Hono Swagger requires scalar api reference');

  const honoSwaggerTs = resolveTemplate('swagger', 'ts', 'esm', 'hono');
  assert.ok(honoSwaggerTs.includes("import { apiReference } from '@scalar/hono-api-reference'"), 'Hono Swagger TS imports scalar api reference');
  assert.ok(honoSwaggerTs.includes("app.get(\n    '/api-docs'"), 'Hono mounts /api-docs endpoint');

  // Koa (CJS, ESM, TS)
  const koaSwaggerCjs = resolveTemplate('swagger', 'js', 'cjs', 'koa');
  assert.ok(koaSwaggerCjs.includes("require('koa2-swagger-ui')"), 'Koa Swagger requires koa2-swagger-ui');

  const koaSwaggerTs = resolveTemplate('swagger', 'ts', 'esm', 'koa');
  assert.ok(koaSwaggerTs.includes("import { koaSwagger } from 'koa2-swagger-ui'"), 'Koa Swagger TS imports koa2-swagger-ui');
  assert.ok(koaSwaggerTs.includes("routePrefix: '/api-docs'"), 'Koa Swagger configures routePrefix');
});

test('Stack-aware plugins: zod template output adapts validation signatures per runtime', () => {
  // Express: (req, res, next)
  const expressZodTs = resolveTemplate('zod', 'ts', 'esm', 'express');
  assert.ok(expressZodTs.includes("import { Request, Response, NextFunction } from 'express'"), 'Express Zod imports Express types');
  assert.ok(expressZodTs.includes('req: Request, res: Response, next: NextFunction'), 'Express Zod signature');

  // Fastify: (req, reply)
  const fastifyZodTs = resolveTemplate('zod', 'ts', 'esm', 'fastify');
  assert.ok(fastifyZodTs.includes("import { FastifyRequest, FastifyReply } from 'fastify'"), 'Fastify Zod imports Fastify types');
  assert.ok(fastifyZodTs.includes('req: FastifyRequest, reply: FastifyReply'), 'Fastify Zod signature');

  // Hono: (c, next)
  const honoZodTs = resolveTemplate('zod', 'ts', 'esm', 'hono');
  assert.ok(honoZodTs.includes("import { Context, Next } from 'hono'"), 'Hono Zod imports Hono types');
  assert.ok(honoZodTs.includes('c: Context, next: Next'), 'Hono Zod signature');

  // Koa: (ctx, next)
  const koaZodTs = resolveTemplate('zod', 'ts', 'esm', 'koa');
  assert.ok(koaZodTs.includes("import { Context, Next } from 'koa'"), 'Koa Zod imports Koa types');
  assert.ok(koaZodTs.includes('ctx: Context, next: Next'), 'Koa Zod signature');
});

test('Stack-aware plugins: detectRuntime detects from config defaults and package.json', () => {
  // From fogoe.config.json
  assert.strictEqual(detectRuntime({ defaults: { runtime: 'fastify' } }), 'fastify');
  assert.strictEqual(detectRuntime({ defaults: { runtime: 'HONO' } }), 'hono');
  assert.strictEqual(detectRuntime({ defaults: { framework: 'koa' } }), 'koa');

  // Default fallback
  assert.strictEqual(detectRuntime({ defaults: {} }), 'express');
  assert.strictEqual(detectRuntime(null), 'express');
});

test('Stack-aware plugins: end-to-end file generation for Fastify and Hono', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fogoe-stack-e2e-'));
  try {
    // 1. Fastify rate limiter file
    const fastifyRateContent = resolveTemplate('ratelimit', 'ts', 'esm', 'fastify');
    const fastifyRateFile = path.join(tmpDir, 'fastify-rate.ts');
    fs.writeFileSync(fastifyRateFile, fastifyRateContent);
    assert.ok(fs.existsSync(fastifyRateFile), 'Fastify rate limiter file was created');
    const readFastifyRate = fs.readFileSync(fastifyRateFile, 'utf8');
    assert.ok(readFastifyRate.includes('@fastify/rate-limit'), 'File contains @fastify/rate-limit');
    assert.ok(readFastifyRate.includes('FastifyInstance'), 'File contains FastifyInstance');

    // 2. Hono swagger file
    const honoSwaggerContent = resolveTemplate('swagger', 'ts', 'esm', 'hono');
    const honoSwaggerFile = path.join(tmpDir, 'hono-swagger.ts');
    fs.writeFileSync(honoSwaggerFile, honoSwaggerContent);
    assert.ok(fs.existsSync(honoSwaggerFile), 'Hono swagger file was created');
    const readHonoSwagger = fs.readFileSync(honoSwaggerFile, 'utf8');
    assert.ok(readHonoSwagger.includes('@scalar/hono-api-reference'), 'File contains @scalar/hono-api-reference');
    assert.ok(readHonoSwagger.includes('/api-docs'), 'File mounts /api-docs');
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});
