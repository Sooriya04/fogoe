/**
 * Production-ready multi-stage Dockerfile and .dockerignore generator.
 */

/**
 * Generate production Dockerfile
 *
 * @param {Object} options
 * @param {string} [options.language] - 'javascript' | 'typescript'
 * @param {string} [options.pm] - 'npm' | 'pnpm' | 'bun' | 'yarn'
 * @param {string} [options.port] - Default '3000'
 * @returns {string} Dockerfile content
 */
function generateDockerfile(options = {}) {
  const {
    language = 'javascript',
    pm = 'npm',
    port = '3000',
  } = options;

  const isTs = language === 'typescript' || language === 'ts';

  if (pm === 'bun') {
    return `# --- Bun Runtime Base ---
FROM oven/bun:1-alpine AS base
WORKDIR /app

# Install dependencies
FROM base AS deps
COPY package.json bun.lock* ./
RUN bun install --frozen-lockfile || bun install

# Production runner
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=${port}

COPY --from=deps /app/node_modules ./node_modules
COPY . .

EXPOSE ${port}
CMD ["bun", "run", "start"]
`;
  }

  // Node.js multi-stage build (npm, pnpm, yarn)
  const lines = [];
  lines.push('# --- Base Node Stage ---');
  lines.push('FROM node:20-alpine AS base');
  lines.push('WORKDIR /app');
  lines.push('RUN apk add --no-cache libc6-compat');
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
  lines.push(`ENV PORT=${port}`);
  lines.push('');
  lines.push('RUN addgroup --system --gid 1001 nodejs && \\');
  lines.push('    adduser --system --uid 1001 fogoe');
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
  lines.push(`EXPOSE ${port}`);
  lines.push('');

  if (isTs) {
    lines.push('CMD ["node", "dist/server.js"]');
  } else {
    lines.push('CMD ["node", "src/server.js"]');
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
  generateDockerfile,
  generateDockerignore,
};
