const fs = require('node:fs');
const path = require('node:path');
const {
  probeSocket,
  probeHttp,
  probeRedis,
  probeDockerCompose,
  normalizeHost,
} = require('./probes');
const { parseEnv } = require('./env');

/**
 * Inspects project configuration and tests connectivity across services.
 * @param {string} targetDir
 * @param {Object} options
 * @returns {Promise<Object>}
 */
async function checkProjectHealth(targetDir = process.cwd(), options = {}) {
  const envPath = path.join(targetDir, '.env');
  const envRaw = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';
  const env = parseEnv(envRaw);

  const configPath = path.join(targetDir, 'fogoe.config.json');
  let config = {};
  if (fs.existsSync(configPath)) {
    try {
      config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    } catch {}
  }

  const results = {
    timestamp: new Date().toISOString(),
    project: config.name || path.basename(targetDir),
    healthy: true,
    services: {},
  };

  // 1. App Server Probe
  const port = Number(env.PORT) || 3000;
  const host = normalizeHost(env.HOST || '127.0.0.1');
  const socketCheck = await probeSocket(host, port, options.timeoutMs);
  let httpCheck = { ok: false };
  if (socketCheck.ok) {
    httpCheck = await probeHttp(`http://${host}:${port}/`, options.timeoutMs);
  }

  results.services.server = {
    configured: true,
    host,
    port,
    listening: socketCheck.ok,
    httpResponding: httpCheck.ok,
    statusCode: httpCheck.statusCode || null,
    latencyMs: socketCheck.latencyMs,
    error: socketCheck.error || httpCheck.error || null,
  };
  if (!socketCheck.ok) results.healthy = false;

  // 2. Database Probe
  const dbUrl = env.DATABASE_URL;
  const dbType = config?.defaults?.database || 'none';

  if (dbUrl) {
    if (dbUrl.startsWith('file:') || dbUrl.startsWith('sqlite:') || dbType === 'sqlite') {
      const dbPath = dbUrl.replace(/^(file:|sqlite:)/, '').trim() || 'dev.db';
      const resolvedDbPath = path.isAbsolute(dbPath) ? dbPath : path.join(targetDir, dbPath);
      const exists = fs.existsSync(resolvedDbPath);
      results.services.database = {
        configured: true,
        type: 'sqlite',
        path: dbPath,
        accessible: exists,
        error: exists ? null : 'FILE_NOT_FOUND',
      };
      if (!exists) results.healthy = false;
    } else {
      try {
        const parsed = new URL(dbUrl);
        const dbHost = normalizeHost(parsed.hostname);
        const defaultPort = parsed.protocol.startsWith('mongodb') ? 27017 : (parsed.protocol.startsWith('mysql') ? 3306 : 5432);
        const dbPort = Number(parsed.port) || defaultPort;

        const dbSocket = await probeSocket(dbHost, dbPort, options.timeoutMs);
        results.services.database = {
          configured: true,
          type: parsed.protocol.replace(':', ''),
          host: dbHost,
          port: dbPort,
          connected: dbSocket.ok,
          latencyMs: dbSocket.latencyMs,
          error: dbSocket.error || null,
        };
        if (!dbSocket.ok) results.healthy = false;
      } catch (err) {
        results.services.database = {
          configured: true,
          error: 'INVALID_DATABASE_URL',
        };
        results.healthy = false;
      }
    }
  } else if (dbType !== 'none') {
    if (dbType === 'sqlite') {
      const dbPath = 'dev.db';
      const resolvedDbPath = path.join(targetDir, dbPath);
      const exists = fs.existsSync(resolvedDbPath);
      results.services.database = {
        configured: true,
        type: 'sqlite',
        path: dbPath,
        accessible: exists,
        error: exists ? null : 'FILE_NOT_FOUND',
        hint: exists ? null : "SQLite database file 'dev.db' not found. It will be created on server start.",
      };
      if (!exists) results.healthy = false;
    } else {
      results.services.database = {
        configured: false,
        type: dbType,
        error: 'MISSING_DATABASE_URL',
        hint: "Add DATABASE_URL to your .env file or run 'fogoe doctor --fix'",
      };
      results.healthy = false;
    }
  }

  // 3. Redis Probe
  const redisUrl = env.REDIS_URL;
  const hasRedisAddon = Array.isArray(config.addons) && (config.addons.includes('redis') || config.addons.includes('queue') || config.addons.includes('bullmq'));

  if (redisUrl || hasRedisAddon) {
    const targetRedisUrl = redisUrl || 'redis://127.0.0.1:6379';
    const redisCheck = await probeRedis(targetRedisUrl, options.timeoutMs);

    results.services.redis = {
      configured: true,
      url: targetRedisUrl,
      reachable: redisCheck.ok,
      latencyMs: redisCheck.latencyMs,
      response: redisCheck.response || null,
      error: redisCheck.error || null,
    };
    if (!redisCheck.ok) results.healthy = false;
  }

  // 4. Docker Compose Probe
  const composePath = path.join(targetDir, 'docker-compose.yml');
  if (fs.existsSync(composePath)) {
    const composeInfo = probeDockerCompose(targetDir, options.timeoutMs);
    results.services.docker = composeInfo;
    if (composeInfo.available && composeInfo.containers.length > 0) {
      const anyStopped = composeInfo.containers.some((c) => !c.running);
      if (anyStopped) {
        results.services.docker.hint = "One or more containers are stopped. Run 'docker compose up -d'";
      }
    }
  }

  return results;
}

module.exports = { checkProjectHealth };
