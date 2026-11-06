const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');
const { buildAgentManifest, writeAgentManifest, getProjectManifest } = require('../src/agent');
const { composeProject } = require('../src/composer');

test('Agent Manifest Builder: generates correct contract for Fastify + TypeScript MVC', () => {
  const manifest = buildAgentManifest({
    name: 'order-api',
    runtime: 'fastify',
    language: 'ts',
    architecture: 'mvc',
    type: 'esm',
    database: 'drizzle',
    auth: 'jwt',
    port: 4000,
    addons: ['redis'],
  });

  assert.strictEqual(manifest.$schema, 'https://fogoe.dev/schema/agent-manifest.v1.json');
  assert.strictEqual(manifest.project.name, 'order-api');
  assert.strictEqual(manifest.project.runtime, 'fastify');
  assert.strictEqual(manifest.project.language, 'typescript');
  assert.strictEqual(manifest.project.architecture, 'mvc');
  assert.strictEqual(manifest.project.defaultPort, 4000);
  assert.strictEqual(manifest.paths.entryPoint, 'src/server.ts');
  assert.strictEqual(manifest.paths.routes, 'src/routes');
  assert.strictEqual(manifest.paths.controllers, 'src/controllers');
  assert.strictEqual(manifest.paths.models, 'src/models');
  assert.strictEqual(manifest.paths.schema, 'src/models/schema.ts');
  assert.ok(manifest.recipes.generateCrud.includes('generate crud'));
  assert.ok(manifest.agentInstructions.length > 0);
});

test('Composer integration: automatically generates fogoe.agent.json upon scaffolding', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fogoe-agent-test-'));
  try {
    composeProject({
      targetDir: tmpDir,
      name: 'agent-app',
      runtime: 'express',
      language: 'typescript',
      architecture: 'mvc',
      database: 'prisma',
      auth: 'jwt',
      type: 'commonjs',
    });

    const agentJsonPath = path.join(tmpDir, 'fogoe.agent.json');
    assert.ok(fs.existsSync(agentJsonPath), 'fogoe.agent.json was generated');

    const manifest = JSON.parse(fs.readFileSync(agentJsonPath, 'utf8'));
    assert.strictEqual(manifest.project.name, 'agent-app');
    assert.strictEqual(manifest.project.runtime, 'express');
    assert.strictEqual(manifest.project.language, 'typescript');
    assert.strictEqual(manifest.paths.schema, 'prisma/schema.prisma');
    assert.strictEqual(manifest.paths.entryPoint, 'src/server.ts');
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('CLI schema command: outputs JSON manifest for AI agents', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fogoe-cli-schema-'));
  try {
    composeProject({
      targetDir: tmpDir,
      name: 'cli-agent-app',
      runtime: 'hono',
      language: 'javascript',
      architecture: 'minimal',
      type: 'module',
    });

    const cliPath = path.resolve(__dirname, '../bin/cli.js');
    const output = execSync(`node ${cliPath} schema --json`, {
      cwd: tmpDir,
      encoding: 'utf8',
    });

    const manifest = JSON.parse(output.trim());
    assert.strictEqual(manifest.project.name, 'cli-agent-app');
    assert.strictEqual(manifest.project.runtime, 'hono');
    assert.strictEqual(manifest.project.architecture, 'minimal');
    assert.strictEqual(manifest.paths.entryPoint, 'src/server.js');
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});
