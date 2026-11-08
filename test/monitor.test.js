const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const net = require('node:net');
const http = require('node:http');
const { execSync } = require('node:child_process');
const {
  normalizeHost,
  probeSocket,
  probeHttp,
  probeRedis,
} = require('../src/monitor/probes');
const { checkProjectHealth, formatDashboard } = require('../src/monitor');
const { renderTuiMonitor, renderBar, formatBytes } = require('../src/tui/monitor');

test('Monitor Probes: normalizeHost converts localhost to 127.0.0.1', () => {
  assert.strictEqual(normalizeHost('localhost'), '127.0.0.1');
  assert.strictEqual(normalizeHost(''), '127.0.0.1');
  assert.strictEqual(normalizeHost(null), '127.0.0.1');
  assert.strictEqual(normalizeHost('192.168.1.1'), '192.168.1.1');
});

test('Monitor Probes: probeSocket successfully detects open TCP port', async () => {
  const server = net.createServer();
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const port = server.address().port;

  try {
    const res = await probeSocket('127.0.0.1', port, 1000);
    assert.strictEqual(res.ok, true);
    assert.strictEqual(typeof res.latencyMs, 'number');
  } finally {
    server.close();
  }
});

test('Monitor Probes: probeSocket returns error on closed port', async () => {
  const res = await probeSocket('127.0.0.1', 49151, 500);
  assert.strictEqual(res.ok, false);
  assert.ok(['ECONNREFUSED', 'ETIMEDOUT'].includes(res.error));
});

test('Monitor Probes: probeHttp validates responding HTTP server', async () => {
  const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('OK');
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const port = server.address().port;

  try {
    const res = await probeHttp(`http://127.0.0.1:${port}/`, 1000);
    assert.strictEqual(res.ok, true);
    assert.strictEqual(res.statusCode, 200);
  } finally {
    server.close();
  }
});

test('Monitor Probes: probeRedis detects mock RESP protocol ping response', async () => {
  const server = net.createServer((socket) => {
    socket.on('data', () => {
      socket.write('+PONG\r\n');
    });
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const port = server.address().port;

  try {
    const res = await probeRedis(`redis://127.0.0.1:${port}`, 1000);
    assert.strictEqual(res.ok, true);
    assert.strictEqual(res.response, '+PONG');
  } finally {
    server.close();
  }
});

test('Monitor Probes: probeRedis accepts -NOAUTH as reachability confirmation', async () => {
  const server = net.createServer((socket) => {
    socket.on('data', () => {
      socket.write('-NOAUTH Authentication required.\r\n');
    });
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const port = server.address().port;

  try {
    const res = await probeRedis(`redis://127.0.0.1:${port}`, 1000);
    assert.strictEqual(res.ok, true);
    assert.ok(res.response.includes('NOAUTH'));
  } finally {
    server.close();
  }
});

test('Monitor: checkProjectHealth accurately identifies SQLite database file', async () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fogoe-mon-sqlite-'));
  try {
    fs.writeFileSync(path.join(tmpDir, 'fogoe.config.json'), JSON.stringify({ defaults: { database: 'sqlite' } }));
    fs.writeFileSync(path.join(tmpDir, '.env'), 'DATABASE_URL="file:./dev.db"\nPORT=3000\n');
    fs.writeFileSync(path.join(tmpDir, 'dev.db'), 'mock-sqlite-header');

    const health = await checkProjectHealth(tmpDir, { timeoutMs: 200 });
    assert.strictEqual(health.services.database.type, 'sqlite');
    assert.strictEqual(health.services.database.accessible, true);
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('Monitor: checkProjectHealth formats ANSI dashboard with service details', () => {
  const mockHealth = {
    timestamp: new Date().toISOString(),
    project: 'demo-app',
    healthy: true,
    services: {
      server: { configured: true, port: 3000, listening: true, latencyMs: 5 },
      database: { configured: true, type: 'postgres', connected: true, latencyMs: 8 },
      redis: { configured: true, reachable: true, latencyMs: 2 },
    },
  };

  const output = formatDashboard(mockHealth);
  assert.ok(output.includes('Fogoe Stack Monitor'));
  assert.ok(output.includes('Application Server'));
  assert.ok(output.includes('Database (postgres)'));
  assert.ok(output.includes('Redis Cache / Queue'));
  assert.ok(output.includes('All monitored services are healthy'));
});

test('CLI monitor integration: node bin/cli.js monitor --json outputs pure machine-readable JSON', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fogoe-cli-mon-'));
  const cliPath = path.resolve(__dirname, '../bin/cli.js');

  try {
    fs.writeFileSync(
      path.join(tmpDir, 'fogoe.config.json'),
      JSON.stringify({ name: 'cli-test-app', defaults: { database: 'none' } }, null, 2)
    );
    fs.writeFileSync(path.join(tmpDir, '.env'), 'PORT=59999\n');

    let output = '';
    try {
      execSync(`node "${cliPath}" monitor --json`, {
        cwd: tmpDir,
        encoding: 'utf8',
      });
    } catch (err) {
      // Exit code 1 is expected because port 59999 is closed
      output = err.stdout;
    }

    const parsed = JSON.parse(output.trim());
    assert.strictEqual(parsed.project, 'cli-test-app');
    assert.strictEqual(parsed.healthy, false);
    assert.strictEqual(parsed.services.server.port, 59999);
    assert.strictEqual(parsed.services.server.listening, false);
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('CLI monitor integration: node bin/cli.js monitor --wait times out and emits JSON payload', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fogoe-cli-mon-wait-'));
  const cliPath = path.resolve(__dirname, '../bin/cli.js');

  try {
    fs.writeFileSync(
      path.join(tmpDir, 'fogoe.config.json'),
      JSON.stringify({ name: 'wait-test-app', defaults: { database: 'none' } }, null, 2)
    );
    fs.writeFileSync(path.join(tmpDir, '.env'), 'PORT=59998\n');

    let output = '';
    assert.throws(() => {
      execSync(`node "${cliPath}" monitor --wait --timeout=500 --json`, {
        cwd: tmpDir,
        encoding: 'utf8',
      });
    }, (err) => {
      output = err.stdout;
      return true;
    });

    const parsed = JSON.parse(output.trim());
    assert.strictEqual(parsed.project, 'wait-test-app');
    assert.strictEqual(parsed.healthy, false);
    assert.strictEqual(parsed.timedOut, true);
    assert.strictEqual(parsed.services.server.port, 59998);
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('TUI Monitor: renderBar formats visual ASCII progress bar', () => {
  const bar0 = renderBar(0, 10);
  const bar50 = renderBar(50, 10);
  const bar100 = renderBar(100, 10);

  assert.ok(bar0.includes('░░░░░░░░░░'));
  assert.ok(bar50.includes('█████'));
  assert.ok(bar100.includes('██████████'));
});

test('TUI Monitor: formatBytes formats KB, MB, and GB accurately', () => {
  assert.strictEqual(formatBytes(512 * 1024), '512 KB');
  assert.strictEqual(formatBytes(128 * 1024 * 1024), '128 MB');
  assert.strictEqual(formatBytes(2.5 * 1024 * 1024 * 1024), '2.5 GB');
});

test('TUI Monitor: renderTuiMonitor formats retro box with telemetry and services', () => {
  const mockHealth = {
    timestamp: new Date().toISOString(),
    project: 'my-tui-app',
    healthy: true,
    services: {
      server: { configured: true, port: 4000, listening: true, httpResponding: true, statusCode: 200, latencyMs: 3 },
      database: { configured: true, type: 'postgres', connected: true, latencyMs: 7 },
      redis: { configured: true, reachable: true, response: '+PONG', latencyMs: 2 },
    },
  };

  const output = renderTuiMonitor(mockHealth);
  assert.ok(output.includes('fogoe monitor'));
  assert.ok(output.includes('LIVE'));
  assert.ok(output.includes('my-tui-app'));
  assert.ok(output.includes('Server'));
  assert.ok(output.includes('Database'));
  assert.ok(output.includes('Redis Queue'));
  assert.ok(output.includes('SYSTEM TELEMETRY'));
  assert.ok(output.includes('Memory:'));
  assert.ok(output.includes('CPU:'));
  assert.ok(output.includes('[r] refresh [q] quit'));
});

test('CLI monitor integration: node bin/cli.js monitor --stats outputs TUI box format', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fogoe-cli-tui-'));
  const cliPath = path.resolve(__dirname, '../bin/cli.js');

  try {
    fs.writeFileSync(
      path.join(tmpDir, 'fogoe.config.json'),
      JSON.stringify({ name: 'tui-cli-app', defaults: { database: 'none' } }, null, 2)
    );
    fs.writeFileSync(path.join(tmpDir, '.env'), 'PORT=59997\n');

    let output = '';
    try {
      execSync(`node "${cliPath}" monitor --stats`, {
        cwd: tmpDir,
        encoding: 'utf8',
      });
    } catch (err) {
      output = err.stdout;
    }

    assert.ok(output.includes('fogoe monitor'));
    assert.ok(output.includes('tui-cli-app'));
    assert.ok(output.includes('SYSTEM TELEMETRY'));
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('TUI Monitor: renderBar safely handles NaN and undefined without throwing', () => {
  const barNaN = renderBar(NaN, 10);
  const barUndefined = renderBar(undefined, 10);
  assert.ok(barNaN.includes('░░░░░░░░░░'));
  assert.ok(barUndefined.includes('░░░░░░░░░░'));
});

test('TUI Monitor: renderTuiMonitor preserves exact 76-char width with long error messages', () => {
  const mockHealth = {
    timestamp: new Date().toISOString(),
    project: 'overflow-test-app',
    healthy: false,
    services: {
      server: {
        configured: true,
        port: 3000,
        listening: false,
        error: 'ENOTFOUND very-long-cluster-domain-name-exceeding-any-normal-column-size.us-east-1.rds.amazonaws.com',
      },
      database: {
        configured: true,
        type: 'postgres',
        connected: false,
        error: 'FATAL: database "super_long_production_customer_data_partition_name_2026" does not exist',
      },
      redis: {
        configured: true,
        reachable: false,
        error: 'ECONNREFUSED 127.0.0.1:6379 (Connection refused after 1500ms timeout retry)',
      },
    },
  };

  const { stripAnsi } = require('../src/tui/monitor');
  const output = renderTuiMonitor(mockHealth);
  const lines = output.trim().split('\n');
  for (const line of lines) {
    assert.strictEqual(stripAnsi(line).length, 76);
  }
});


