const test = require('node:test');
const assert = require('node:assert');
const { parseAiPrompt } = require('../src/ai');

test('AI Parser: Fastify + TypeScript + Drizzle ORM + JWT', () => {
  const result = parseAiPrompt('A high performance Fastify backend with PostgreSQL using Drizzle ORM and JWT in TypeScript');

  assert.strictEqual(result.runtime, 'fastify');
  assert.strictEqual(result.language, 'typescript');
  assert.strictEqual(result.database, 'drizzle');
  assert.strictEqual(result.useJwt, true);
  assert.strictEqual(result.architecture, 'mvc');
  assert.strictEqual(result.type, 'module');
});

test('AI Parser: Minimal Hono + JavaScript + Vitest testing suite', () => {
  const result = parseAiPrompt('Minimal single-file Hono microservice in JavaScript with Vitest tests and git init');

  assert.strictEqual(result.runtime, 'hono');
  assert.strictEqual(result.language, 'javascript');
  assert.strictEqual(result.architecture, 'minimal');
  assert.strictEqual(result.database, 'none');
  assert.strictEqual(result.testing, true);
  assert.strictEqual(result.git, true);
});

test('AI Parser: Express + MongoDB + Argon2 + ESLint', () => {
  const result = parseAiPrompt('Express REST API with MongoDB Mongoose, Argon2 hashing, and ESLint formatting');

  assert.strictEqual(result.runtime, 'express');
  assert.strictEqual(result.database, 'mongodb');
  assert.strictEqual(result.hashing, 'argon2');
  assert.strictEqual(result.linting, true);
  assert.strictEqual(result.architecture, 'mvc');
});

test('AI Parser: Gracefully handles empty or vague prompt with sensible defaults', () => {
  const emptyResult = parseAiPrompt('');
  assert.strictEqual(emptyResult, null);

  const vagueResult = parseAiPrompt('Just a simple backend');
  assert.strictEqual(vagueResult.runtime, 'express');
  assert.strictEqual(vagueResult.language, 'javascript');
  assert.strictEqual(vagueResult.architecture, 'minimal');
  assert.strictEqual(vagueResult.database, 'none');
});
