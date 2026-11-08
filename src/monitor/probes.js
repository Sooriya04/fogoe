const net = require('node:net');
const http = require('node:http');
const https = require('node:https');
const tls = require('node:tls');
const fs = require('node:fs');
const { execFileSync } = require('node:child_process');

/**
 * Normalizes host to IPv4 127.0.0.1 if localhost to avoid Node 17+ IPv6 dual-stack resolution delays.
 * @param {string} host
 * @returns {string}
 */
function normalizeHost(host) {
  if (!host || host === 'localhost') return '127.0.0.1';
  return host;
}

/**
 * Probes a raw TCP port with timeout.
 * @param {string} host
 * @param {number} port
 * @param {number} timeoutMs
 * @returns {Promise<{ ok: boolean, latencyMs: number, error?: string }>}
 */
function probeSocket(host, port, timeoutMs = 1500) {
  const targetHost = normalizeHost(host);
  const targetPort = Number(port);

  return new Promise((resolve) => {
    const start = Date.now();
    const socket = new net.Socket();

    socket.setTimeout(timeoutMs);

    socket.once('connect', () => {
      const latencyMs = Date.now() - start;
      socket.destroy();
      resolve({ ok: true, latencyMs });
    });

    socket.once('timeout', () => {
      socket.destroy();
      resolve({ ok: false, latencyMs: timeoutMs, error: 'ETIMEDOUT' });
    });

    socket.once('error', (err) => {
      socket.destroy();
      resolve({ ok: false, latencyMs: Date.now() - start, error: err.code || err.message });
    });

    socket.connect(targetPort, targetHost);
  });
}

/**
 * Lightweight HTTP check to verify server is responding to HTTP requests.
 * @param {string} urlString
 * @param {number} timeoutMs
 * @returns {Promise<{ ok: boolean, statusCode?: number, latencyMs: number, error?: string }>}
 */
function probeHttp(urlString, timeoutMs = 1500) {
  return new Promise((resolve) => {
    try {
      const parsedUrl = new URL(urlString);
      const isHttps = parsedUrl.protocol === 'https:';
      const client = isHttps ? https : http;
      const start = Date.now();

      const req = client.request(
        parsedUrl,
        {
          method: 'GET',
          timeout: timeoutMs,
          headers: { 'User-Agent': 'fogoe-monitor/1.0' },
        },
        (res) => {
          const latencyMs = Date.now() - start;
          resolve({ ok: true, statusCode: res.statusCode, latencyMs });
          res.resume(); // consume response data to free up memory
        }
      );

      req.once('timeout', () => {
        req.destroy();
        resolve({ ok: false, latencyMs: timeoutMs, error: 'ETIMEDOUT' });
      });

      req.once('error', (err) => {
        resolve({ ok: false, latencyMs: Date.now() - start, error: err.code || err.message });
      });

      req.end();
    } catch (err) {
      resolve({ ok: false, latencyMs: 0, error: err.message });
    }
  });
}

/**
 * Probes Redis reachability over standard RESP protocol.
 * Accepts both +PONG and -NOAUTH as confirmation that the Redis broker is online.
 * @param {string} redisUrl
 * @param {number} timeoutMs
 * @returns {Promise<{ ok: boolean, response?: string, latencyMs: number, error?: string }>}
 */
function probeRedis(redisUrl = 'redis://127.0.0.1:6379', timeoutMs = 1500) {
  return new Promise((resolve) => {
    try {
      const parsed = new URL(redisUrl);
      const host = normalizeHost(parsed.hostname);
      const port = Number(parsed.port) || 6379;
      const isTls = parsed.protocol === 'rediss:';

      const start = Date.now();
      const socket = isTls ? tls.connect(port, host, { rejectUnauthorized: false }) : net.connect(port, host);

      socket.setTimeout(timeoutMs);

      socket.once('connect', () => {
        socket.write('PING\r\n');
      });

      socket.once('data', (data) => {
        const text = data.toString('utf8');
        const latencyMs = Date.now() - start;
        socket.destroy();

        if (text.startsWith('+PONG') || text.includes('NOAUTH') || text.startsWith('+OK')) {
          resolve({ ok: true, response: text.trim(), latencyMs });
        } else {
          resolve({ ok: false, response: text.trim(), latencyMs, error: 'UNEXPECTED_RESP' });
        }
      });

      socket.once('timeout', () => {
        socket.destroy();
        resolve({ ok: false, latencyMs: timeoutMs, error: 'ETIMEDOUT' });
      });

      socket.once('error', (err) => {
        socket.destroy();
        resolve({ ok: false, latencyMs: Date.now() - start, error: err.code || err.message });
      });
    } catch (err) {
      resolve({ ok: false, latencyMs: 0, error: err.message });
    }
  });
}

/**
 * Checks Docker Compose container status via `docker compose ps --format json`.
 * @param {string} cwd
 * @param {number} timeoutMs
 * @returns {{ available: boolean, containers: Array, error?: string }}
 */
function probeDockerCompose(cwd = process.cwd(), timeoutMs = 1500) {
  try {
    const isWindows = process.platform === 'win32';
    const output = execFileSync('docker', ['compose', 'ps', '--format', 'json'], {
      cwd,
      timeout: timeoutMs,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
      shell: isWindows,
    });

    if (!output.trim()) {
      return { available: true, containers: [] };
    }

    // docker compose ps returns either a single JSON array or newline-delimited JSON objects
    const lines = output.trim().split('\n').filter(Boolean);
    const containers = [];

    for (const line of lines) {
      try {
        const parsed = JSON.parse(line);
        if (Array.isArray(parsed)) {
          containers.push(...parsed);
        } else {
          containers.push(parsed);
        }
      } catch {}
    }

    const formatted = containers.map((c) => ({
      name: c.Name || c.Service || 'unknown',
      service: c.Service || c.Name || 'unknown',
      state: c.State || c.Status || 'unknown',
      health: c.Health || 'none',
      running: String(c.State || '').toLowerCase() === 'running',
    }));

    return { available: true, containers: formatted };
  } catch (err) {
    return { available: false, containers: [], error: err.code || err.message };
  }
}

module.exports = {
  normalizeHost,
  probeSocket,
  probeHttp,
  probeRedis,
  probeDockerCompose,
};
