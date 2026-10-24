/**
 * Production-ready multi-stage Dockerfile and .dockerignore generator.
 * Supports Alpine, Debian Slim, Ubuntu, and Distroless distributions.
 */

const DOCKER_OS_OPTIONS = {
  alpine: {
    id: 'alpine',
    label: 'Alpine Linux (node:20-alpine) — Ultra-lightweight (~140MB), minimal attack surface (Recommended)',
    name: 'Alpine Linux',
    nodeBase: 'node:20-alpine',
    bunBase: 'oven/bun:1-alpine',
  },
  debian: {
    id: 'debian',
    label: 'Debian Slim (node:20-slim) — Standard glibc environment (~220MB), maximum C/C++ compatibility',
    name: 'Debian Slim',
    nodeBase: 'node:20-slim',
    bunBase: 'oven/bun:1-slim',
  },
  ubuntu: {
    id: 'ubuntu',
    label: 'Ubuntu / Node Full (node:20) — Full environment with build tools (gcc, make, python)',
    name: 'Ubuntu',
    nodeBase: 'node:20',
    bunBase: 'oven/bun:1',
  },
  distroless: {
    id: 'distroless',
    label: 'Google Distroless (gcr.io/distroless/nodejs20) — Hardened, package manager & shell-free',
    name: 'Google Distroless',
    nodeBase: 'node:20-alpine',
    runnerBase: 'gcr.io/distroless/nodejs20-debian12',
    bunBase: 'oven/bun:1-alpine',
    bunRunnerBase: 'oven/bun:distroless',
  },
};

/**
 * Normalizes user-supplied OS option
 * @param {string} os
 * @returns {string} 'alpine' | 'debian' | 'ubuntu' | 'distroless'
 */
function normalizeDockerOs(os = 'alpine') {
  if (!os) return 'alpine';
  const clean = String(os).toLowerCase().trim();
  if (clean.includes('debian') || clean === 'slim') return 'debian';
  if (clean.includes('ubuntu') || clean === 'full') return 'ubuntu';
  if (clean.includes('distroless')) return 'distroless';
  return 'alpine';
}

/**
 * Generate production Dockerfile
 *
 * @param {Object} options
 * @param {string} [options.language] - 'javascript' | 'typescript'
 * @param {string} [options.pm] - 'npm' | 'pnpm' | 'bun' | 'yarn'
 * @param {string} [options.port] - Default '3000'
 * @param {string} [options.os] - 'alpine' | 'debian' | 'ubuntu' | 'distroless'
 * @returns {string} Dockerfile content
 */
function generateDockerfile(options = {}) {
  const opts = options || {};
  const {
    language = 'javascript',
    pm = 'npm',
    port = '3000',
    os = 'alpine',
  } = opts;

  const targetOs = normalizeDockerOs(os);
  const targetPort = String(port || '3000').trim();
  const isTs = language === 'typescript' || language === 'ts';

  // ── Bun Runtime ──────────────────────────────────────────────────────────
  if (pm === 'bun') {
    if (targetOs === 'distroless') {
      return `# --- Bun Runtime Base ---
FROM ${DOCKER_OS_OPTIONS.distroless.bunBase} AS base
WORKDIR /app

# Install dependencies
FROM base AS deps
COPY package.json bun.lock* ./
RUN bun install --frozen-lockfile || bun install

# Production runner (Distroless)
FROM ${DOCKER_OS_OPTIONS.distroless.bunRunnerBase} AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=${targetPort}

COPY --from=deps /app/node_modules ./node_modules
COPY . .

EXPOSE ${targetPort}
CMD ["run", "start"]
`;
    }

    const bunBase = targetOs === 'debian'
      ? DOCKER_OS_OPTIONS.debian.bunBase
      : (targetOs === 'ubuntu' ? DOCKER_OS_OPTIONS.ubuntu.bunBase : DOCKER_OS_OPTIONS.alpine.bunBase);

    return `# --- Bun Runtime Base (${DOCKER_OS_OPTIONS[targetOs].name}) ---
FROM ${bunBase} AS base
WORKDIR /app

# Install dependencies
FROM base AS deps
COPY package.json bun.lock* ./
RUN bun install --frozen-lockfile || bun install

# Production runner
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=${targetPort}

COPY --from=deps /app/node_modules ./node_modules
COPY . .

EXPOSE ${targetPort}
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \\
  CMD wget --no-verbose --tries=1 --spider http://localhost:${targetPort}/health || exit 1

CMD ["bun", "run", "start"]
`;
  }

  // ── Node.js Runtime (Distroless) ─────────────────────────────────────────
  if (targetOs === 'distroless') {
    const lines = [];
    lines.push('# --- Base Node Builder (Alpine) ---');
    lines.push(`FROM ${DOCKER_OS_OPTIONS.distroless.nodeBase} AS base`);
    lines.push('WORKDIR /app');
    lines.push('RUN apk add --no-cache libc6-compat');
    lines.push('');

    lines.push('# --- Dependencies Stage ---');
    lines.push('FROM base AS deps');
    lines.push('WORKDIR /app');
    if (pm === 'pnpm') {
      lines.push('RUN corepack enable && corepack prepare pnpm@latest --activate');
      lines.push('COPY package.json pnpm-lock.yaml* ./');
      lines.push('RUN pnpm install --frozen-lockfile || pnpm install --config.dangerouslyAllowAllBuilds=true');
    } else if (pm === 'yarn') {
      lines.push('COPY package.json yarn.lock* ./');
      lines.push('RUN yarn install --frozen-lockfile || yarn install');
    } else {
      lines.push('COPY package.json package-lock.json* ./');
      lines.push('RUN npm ci || npm install');
    }
    lines.push('');

    if (isTs) {
      lines.push('# --- Builder Stage ---');
      lines.push('FROM base AS builder');
      lines.push('WORKDIR /app');
      lines.push('COPY --from=deps /app/node_modules ./node_modules');
      lines.push('COPY . .');
      if (pm === 'pnpm') {
        lines.push('RUN corepack enable && corepack prepare pnpm@latest --activate');
        lines.push('RUN pnpm run build');
      } else if (pm === 'yarn') {
        lines.push('RUN yarn run build');
      } else {
        lines.push('RUN npm run build');
      }
      lines.push('');
    }

    lines.push('# --- Production Runner Stage (Google Distroless) ---');
    lines.push(`FROM ${DOCKER_OS_OPTIONS.distroless.runnerBase} AS runner`);
    lines.push('WORKDIR /app');
    lines.push('ENV NODE_ENV=production');
    lines.push(`ENV PORT=${targetPort}`);
    lines.push('');

    if (isTs) {
      lines.push('COPY --from=deps /app/node_modules ./node_modules');
      lines.push('COPY --from=builder /app/dist ./dist');
      lines.push('COPY --from=builder /app/package.json ./package.json');
    } else {
      lines.push('COPY --from=deps /app/node_modules ./node_modules');
      lines.push('COPY . .');
    }
    lines.push('');
    lines.push('USER nonroot');
    lines.push(`EXPOSE ${targetPort}`);
    lines.push('');

    if (isTs) {
      lines.push('CMD ["dist/server.js"]');
    } else {
      lines.push('CMD ["src/server.js"]');
    }

    return lines.join('\n').trim() + '\n';
  }

  // ── Node.js Runtime (Alpine, Debian Slim, Ubuntu) ────────────────────────
  const osConfig = DOCKER_OS_OPTIONS[targetOs] || DOCKER_OS_OPTIONS.alpine;
  const baseImage = osConfig.nodeBase;

  const lines = [];
  lines.push(`# --- Base Node Stage (${osConfig.name}) ---`);
  lines.push(`FROM ${baseImage} AS base`);
  lines.push('WORKDIR /app');

  if (targetOs === 'alpine') {
    lines.push('RUN apk add --no-cache libc6-compat');
  }
  lines.push('');

  // Package manager setup & dependency installation
  lines.push('# --- Dependencies Stage ---');
  lines.push('FROM base AS deps');
  lines.push('WORKDIR /app');

  if (pm === 'pnpm') {
    lines.push('RUN corepack enable && corepack prepare pnpm@latest --activate');
    lines.push('COPY package.json pnpm-lock.yaml* ./');
    lines.push('RUN pnpm install --frozen-lockfile || pnpm install --config.dangerouslyAllowAllBuilds=true');
  } else if (pm === 'yarn') {
    lines.push('COPY package.json yarn.lock* ./');
    lines.push('RUN yarn install --frozen-lockfile || yarn install');
  } else {
    lines.push('COPY package.json package-lock.json* ./');
    lines.push('RUN npm ci || npm install');
  }
  lines.push('');

  if (isTs) {
    // Build stage for TypeScript
    lines.push('# --- Builder Stage ---');
    lines.push('FROM base AS builder');
    lines.push('WORKDIR /app');
    lines.push('COPY --from=deps /app/node_modules ./node_modules');
    lines.push('COPY . .');
    if (pm === 'pnpm') {
      lines.push('RUN corepack enable && corepack prepare pnpm@latest --activate');
      lines.push('RUN pnpm run build');
    } else if (pm === 'yarn') {
      lines.push('RUN yarn run build');
    } else {
      lines.push('RUN npm run build');
    }
    lines.push('');
  }

  // Runner stage
  lines.push('# --- Production Runner Stage ---');
  lines.push('FROM base AS runner');
  lines.push('WORKDIR /app');
  lines.push('ENV NODE_ENV=production');
  lines.push(`ENV PORT=${targetPort}`);
  lines.push('');

  // System user setup
  if (targetOs === 'alpine') {
    lines.push('RUN addgroup --system --gid 1001 nodejs && \\');
    lines.push('    adduser --system --uid 1001 fogoe');
  } else {
    // Debian Slim and Ubuntu
    lines.push('RUN groupadd --system --gid 1001 nodejs && \\');
    lines.push('    useradd --system --uid 1001 -g nodejs fogoe');
  }
  lines.push('');

  if (isTs) {
    lines.push('COPY --from=deps --chown=fogoe:nodejs /app/node_modules ./node_modules');
    lines.push('COPY --from=builder --chown=fogoe:nodejs /app/dist ./dist');
    lines.push('COPY --from=builder --chown=fogoe:nodejs /app/package.json ./package.json');
  } else {
    lines.push('COPY --from=deps --chown=fogoe:nodejs /app/node_modules ./node_modules');
    lines.push('COPY --chown=fogoe:nodejs . .');
  }

  lines.push('');
  lines.push('USER fogoe');
  lines.push(`EXPOSE ${targetPort}`);
  lines.push('');

  // Built-in container healthcheck
  if (targetOs === 'alpine') {
    lines.push('HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \\');
    lines.push(`  CMD wget --no-verbose --tries=1 --spider http://localhost:${targetPort}/health || exit 1`);
  } else {
    lines.push('HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \\');
    lines.push(`  CMD node -e "require('http').get('http://localhost:${targetPort}/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1)).on('error', () => process.exit(1))" || exit 1`);
  }
  lines.push('');

  if (isTs) {
    lines.push('CMD ["node", "dist/server.js"]');
  } else {
    lines.push('CMD ["node", "src/server.js"]');
  }

  return lines.join('\n').trim() + '\n';
}

/**
 * Generate development Dockerfile with hot-reload and volume support
 *
 * @param {Object} options
 * @param {string} [options.language]
 * @param {string} [options.pm]
 * @param {string} [options.port]
 * @param {string} [options.os]
 * @returns {string}
 */
function generateDevDockerfile(options = {}) {
  const opts = options || {};
  const {
    language = 'javascript',
    pm = 'npm',
    port = '3000',
    os = 'alpine',
  } = opts;

  const targetOs = normalizeDockerOs(os);
  const targetPort = String(port || '3000').trim();
  const osConfig = DOCKER_OS_OPTIONS[targetOs] || DOCKER_OS_OPTIONS.alpine;
  const baseImage = pm === 'bun' ? osConfig.bunBase : osConfig.nodeBase;

  const lines = [];
  lines.push(`# --- Fogoe Development Container (${osConfig.name}) ---`);
  lines.push(`FROM ${baseImage}`);
  lines.push('WORKDIR /app');
  lines.push('ENV NODE_ENV=development');
  lines.push(`ENV PORT=${targetPort}`);
  lines.push('');

  if (targetOs === 'alpine' && pm !== 'bun') {
    lines.push('RUN apk add --no-cache libc6-compat');
    lines.push('');
  }

  if (pm === 'pnpm') {
    lines.push('RUN corepack enable && corepack prepare pnpm@latest --activate');
    lines.push('COPY package.json pnpm-lock.yaml* ./');
    lines.push('RUN pnpm install --config.dangerouslyAllowAllBuilds=true');
  } else if (pm === 'yarn') {
    lines.push('COPY package.json yarn.lock* ./');
    lines.push('RUN yarn install');
  } else if (pm === 'bun') {
    lines.push('COPY package.json bun.lock* ./');
    lines.push('RUN bun install');
  } else {
    lines.push('COPY package.json package-lock.json* ./');
    lines.push('RUN npm install');
  }
  lines.push('');

  lines.push('COPY . .');
  lines.push(`EXPOSE ${targetPort}`);
  lines.push('');

  if (pm === 'bun') {
    lines.push('CMD ["bun", "run", "dev"]');
  } else if (pm === 'pnpm') {
    lines.push('CMD ["pnpm", "run", "dev"]');
  } else if (pm === 'yarn') {
    lines.push('CMD ["yarn", "run", "dev"]');
  } else {
    lines.push('CMD ["npm", "run", "dev"]');
  }

  return lines.join('\n').trim() + '\n';
}

/**
 * Generate standard .dockerignore
 * @returns {string}
 */
function generateDockerignore() {
  return `node_modules
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*
.git
.github
.env
.env.local
.env.*.local
dist
coverage
*.sqlite
*.db
*.tsbuildinfo
.DS_Store
`;
}

module.exports = {
  DOCKER_OS_OPTIONS,
  normalizeDockerOs,
  generateDockerfile,
  generateDevDockerfile,
  generateDockerignore,
};
