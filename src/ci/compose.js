const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

/**
 * Generate production / standard docker-compose.yml tailored to project stack
 *
 * @param {Object} options
 * @param {string} [options.name] - Project name
 * @param {string} [options.port] - App port
 * @param {string} [options.database] - Database type: postgres, mongodb, mysql, sqlite, none
 * @param {boolean} [options.redis] - Whether Redis is enabled
 * @returns {string} docker-compose.yml content
 */
function generateDockerCompose(options = {}) {
  const {
    name = 'fogoe-app',
    port = '3000',
    database = 'none',
    redis = false,
  } = options;

  const dbLower = String(database).toLowerCase();
  const isPostgres = dbLower.includes('postgres') || dbLower.includes('drizzle') || dbLower.includes('prisma');
  const isMongo = dbLower.includes('mongo');
  const isMysql = dbLower.includes('mysql');

  const lines = [];
  lines.push('services:');

  // ── App Service ──────────────────────────────────────────────────────────
  lines.push('  app:');
  lines.push('    build:');
  lines.push('      context: .');
  lines.push('      dockerfile: Dockerfile');
  lines.push(`    container_name: ${name}`);
  lines.push('    restart: unless-stopped');
  lines.push('    ports:');
  lines.push(`      - "${port}:${port}"`);
  lines.push('    environment:');
  lines.push('      - NODE_ENV=production');
  lines.push(`      - PORT=${port}`);

  if (isPostgres) {
    lines.push('      - DATABASE_URL=postgresql://fogoe:fogoe_password@db:5432/fogoe_db');
  } else if (isMongo) {
    lines.push('      - DATABASE_URL=mongodb://fogoe:fogoe_password@db:27017/fogoe_db?authSource=admin');
  } else if (isMysql) {
    lines.push('      - DATABASE_URL=mysql://root:fogoe_password@db:3306/fogoe_db');
  }

  if (redis) {
    lines.push('      - REDIS_URL=redis://redis:6379');
  }

  const depends = [];
  if (isPostgres || isMongo || isMysql) depends.push('db');
  if (redis) depends.push('redis');

  if (depends.length > 0) {
    lines.push('    depends_on:');
    for (const dep of depends) {
      if (dep === 'db' && isPostgres) {
        lines.push('      db:');
        lines.push('        condition: service_healthy');
      } else {
        lines.push(`      - ${dep}`);
      }
    }
  }

  lines.push('    networks:');
  lines.push('      - fogoe-network');
  lines.push('');

  // ── Database Service ─────────────────────────────────────────────────────
  if (isPostgres) {
    lines.push('  db:');
    lines.push('    image: postgres:16-alpine');
    lines.push(`    container_name: ${name}-db`);
    lines.push('    restart: unless-stopped');
    lines.push('    environment:');
    lines.push('      POSTGRES_USER: fogoe');
    lines.push('      POSTGRES_PASSWORD: fogoe_password');
    lines.push('      POSTGRES_DB: fogoe_db');
    lines.push('    ports:');
    lines.push('      - "5432:5432"');
    lines.push('    volumes:');
    lines.push('      - postgres_data:/var/lib/postgresql/data');
    lines.push('    healthcheck:');
    lines.push('      test: ["CMD-SHELL", "pg_isready -U fogoe -d fogoe_db"]');
    lines.push('      interval: 10s');
    lines.push('      timeout: 5s');
    lines.push('      retries: 5');
    lines.push('    networks:');
    lines.push('      - fogoe-network');
    lines.push('');
  } else if (isMongo) {
    lines.push('  db:');
    lines.push('    image: mongo:7-jammy');
    lines.push(`    container_name: ${name}-db`);
    lines.push('    restart: unless-stopped');
    lines.push('    environment:');
    lines.push('      MONGO_INITDB_ROOT_USERNAME: fogoe');
    lines.push('      MONGO_INITDB_ROOT_PASSWORD: fogoe_password');
    lines.push('    ports:');
    lines.push('      - "27017:27017"');
    lines.push('    volumes:');
    lines.push('      - mongo_data:/data/db');
    lines.push('    networks:');
    lines.push('      - fogoe-network');
    lines.push('');
  } else if (isMysql) {
    lines.push('  db:');
    lines.push('    image: mysql:8');
    lines.push(`    container_name: ${name}-db`);
    lines.push('    restart: unless-stopped');
    lines.push('    environment:');
    lines.push('      MYSQL_ROOT_PASSWORD: fogoe_password');
    lines.push('      MYSQL_DATABASE: fogoe_db');
    lines.push('    ports:');
    lines.push('      - "3306:3306"');
    lines.push('    volumes:');
    lines.push('      - mysql_data:/var/lib/mysql');
    lines.push('    healthcheck:');
    lines.push('      test: ["CMD", "mysqladmin", "ping", "-h", "localhost"]');
    lines.push('      interval: 10s');
    lines.push('      timeout: 5s');
    lines.push('      retries: 5');
    lines.push('    networks:');
    lines.push('      - fogoe-network');
    lines.push('');
  }

  // ── Redis Service ────────────────────────────────────────────────────────
  if (redis) {
    lines.push('  redis:');
    lines.push('    image: redis:7-alpine');
    lines.push(`    container_name: ${name}-redis`);
    lines.push('    restart: unless-stopped');
    lines.push('    ports:');
    lines.push('      - "6379:6379"');
    lines.push('    volumes:');
    lines.push('      - redis_data:/data');
    lines.push('    healthcheck:');
    lines.push('      test: ["CMD", "redis-cli", "ping"]');
    lines.push('      interval: 10s');
    lines.push('      timeout: 5s');
    lines.push('      retries: 5');
    lines.push('    networks:');
    lines.push('      - fogoe-network');
    lines.push('');
  }

  // ── Networks & Volumes ───────────────────────────────────────────────────
  lines.push('networks:');
  lines.push('  fogoe-network:');
  lines.push('    driver: bridge');
  lines.push('');

  const volumes = [];
  if (isPostgres) volumes.push('postgres_data');
  if (isMongo) volumes.push('mongo_data');
  if (isMysql) volumes.push('mysql_data');
  if (redis) volumes.push('redis_data');

  if (volumes.length > 0) {
    lines.push('volumes:');
    for (const vol of volumes) {
      lines.push(`  ${vol}:`);
    }
    lines.push('');
  }

  return lines.join('\n').trim() + '\n';
}

/**
 * Setup Docker Compose orchestrator
 *
 * @param {Object} options
 * @param {string} [options.targetDir]
 * @param {boolean} [options.silent]
 * @returns {Promise<Object>}
 */
async function setupCompose(options = {}) {
  const {
    targetDir = process.cwd(),
    silent = false,
  } = options;

  let projectName = path.basename(targetDir);
  let database = 'none';
  let redis = false;
  let port = '3000';

  const configPath = path.join(targetDir, 'fogoe.config.json');
  if (fs.existsSync(configPath)) {
    try {
      const cfg = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      if (cfg.name) projectName = cfg.name;
      if (cfg.defaults && cfg.defaults.database) database = cfg.defaults.database;
      if (cfg.addons && Array.isArray(cfg.addons)) {
        if (cfg.addons.includes('redis')) redis = true;
      }
    } catch {}
  }

  const composePath = path.join(targetDir, 'docker-compose.yml');
  const composeContent = generateDockerCompose({
    name: projectName,
    port,
    database,
    redis,
  });

  fs.writeFileSync(composePath, composeContent);

  // Update fogoe.config.json addons
  if (fs.existsSync(configPath)) {
    try {
      const cfg = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      if (!cfg.addons) cfg.addons = [];
      if (!cfg.addons.includes('compose')) cfg.addons.push('compose');
      fs.writeFileSync(configPath, JSON.stringify(cfg, null, 2));
    } catch {}
  }

  if (!silent) {
    console.log(chalk.green('  ✓ Created docker-compose.yml'));
  }

  return {
    configured: true,
    file: 'docker-compose.yml',
  };
}

module.exports = {
  generateDockerCompose,
  setupCompose,
};
