const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { resolveTemplate } = require('../src/plugins');
const { getPluginConfig, PLUGINS } = require('../src/plugins/registry');

test('Queue plugin: metadata and registry definitions', () => {
  // Plugin: queue
  const queueMeta = getPluginConfig('queue');
  assert.ok(queueMeta, 'queue plugin exists');
  assert.strictEqual(queueMeta.packages, 'bullmq');
  assert.strictEqual(queueMeta.devPackages, '');
  assert.strictEqual(queueMeta.outputDir, 'src/queues');
  assert.strictEqual(queueMeta.outputFile, 'queue');
  assert.strictEqual(queueMeta.template, 'queue');
  assert.strictEqual(queueMeta.envVars, 'REDIS_URL=redis://localhost:6379');
  assert.ok(queueMeta.description.includes('BullMQ'), 'description mentions BullMQ');

  // Alias: bullmq
  const bullmqMeta = getPluginConfig('bullmq');
  assert.ok(bullmqMeta, 'bullmq alias exists');
  assert.strictEqual(bullmqMeta.packages, 'bullmq');
  assert.strictEqual(bullmqMeta.outputDir, 'src/queues');
  assert.strictEqual(bullmqMeta.outputFile, 'queue');

  // PLUGINS direct property check
  assert.ok(PLUGINS.queue, 'PLUGINS.queue is registered');
  assert.ok(PLUGINS.bullmq, 'PLUGINS.bullmq is registered');
});

test('Queue plugin: CommonJS template produces valid BullMQ code', () => {
  const cjs = resolveTemplate('queue', 'js', 'cjs');

  assert.ok(cjs.includes("const { Queue, Worker } = require('bullmq')"), 'imports Queue and Worker from bullmq');
  assert.ok(cjs.includes("process.env.REDIS_URL || 'redis://127.0.0.1:6379'"), 'uses REDIS_URL with fallback');
  assert.ok(cjs.includes('maxRetriesPerRequest: null'), 'configures maxRetriesPerRequest: null for BullMQ compatibility');
  assert.ok(cjs.includes("const defaultQueue = new Queue('default', { connection })"), 'instantiates defaultQueue');
  assert.ok(cjs.includes("const defaultWorker = new Worker("), 'instantiates defaultWorker');
  assert.ok(cjs.includes("defaultWorker.on('completed'"), 'binds completed event listener');
  assert.ok(cjs.includes("defaultWorker.on('failed'"), 'binds failed event listener');
  assert.ok(cjs.includes('async function addJob(name, data = {}, opts = {})'), 'provides addJob helper');
  assert.ok(cjs.includes('module.exports = {'), 'exports defaultQueue, defaultWorker, addJob');
});

test('Queue plugin: ESM template produces valid BullMQ code', () => {
  const esm = resolveTemplate('queue', 'js', 'esm');

  assert.ok(esm.includes("import { Queue, Worker } from 'bullmq'"), 'imports Queue and Worker via ESM syntax');
  assert.ok(esm.includes('export const defaultQueue = new Queue'), 'exports defaultQueue');
  assert.ok(esm.includes('export const defaultWorker = new Worker'), 'exports defaultWorker');
  assert.ok(esm.includes('export async function addJob'), 'exports addJob helper');
  assert.ok(esm.includes('export default {'), 'exports default object');
});

test('Queue plugin: TypeScript template provides strong types and generics', () => {
  const ts = resolveTemplate('queue', 'ts', 'esm');

  assert.ok(ts.includes("import { Queue, Worker, Job } from 'bullmq'"), 'imports Job type from bullmq');
  assert.ok(ts.includes('async (job: Job) => {'), 'strongly types worker job parameter');
  assert.ok(ts.includes('async function addJob<T = any>(name: string, data: T = {} as T, opts = {})'), 'provides generic addJob<T>');
  assert.ok(ts.includes('maxRetriesPerRequest: null'), 'includes maxRetriesPerRequest: null');
});

test('Queue plugin: end-to-end scaffolding and verification in temporary directory', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fogoe-queue-test-'));
  try {
    const queueContent = resolveTemplate('queue', 'ts', 'esm');
    const queueDir = path.join(tmpDir, 'src/queues');
    fs.mkdirSync(queueDir, { recursive: true });
    const queueFile = path.join(queueDir, 'queue.ts');
    fs.writeFileSync(queueFile, queueContent);

    assert.ok(fs.existsSync(queueFile), 'queue.ts was created successfully');
    const read = fs.readFileSync(queueFile, 'utf8');
    assert.ok(read.includes("import { Queue, Worker, Job } from 'bullmq'"));
    assert.ok(read.includes('defaultQueue'));
    assert.ok(read.includes('defaultWorker'));
    assert.ok(read.includes('addJob'));
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});
