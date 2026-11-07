/**
 * Plugin registry — maps plugin names to their metadata.
 * Each entry defines:
 *   - description: human-readable summary shown in the select prompt
 *   - packages: npm package(s) to install as --save (fallback / default)
 *   - devPackages: npm package(s) to install as --save-dev (optional)
 *   - outputDir: where the scaffolded file goes (relative to project root)
 *   - outputFile: filename (without extension — extension added at runtime)
 *   - template: key in templates.js that holds the file content
 *   - envVars: string of env vars to append to .env (null if none)
 *   - stacks: optional framework-specific overrides ({ express, fastify, hono, koa })
 */

const PLUGINS = {
  redis: {
    description: 'Redis client (ioredis) — fast in-memory data store',
    packages: 'ioredis',
    devPackages: '',
    outputDir: 'src/config',
    outputFile: 'redis',
    template: 'redis',
    envVars: 'REDIS_URL=redis://localhost:6379',
  },
  queue: {
    description: 'BullMQ — fast, robust background job & message queue (Redis)',
    packages: 'bullmq',
    devPackages: '',
    outputDir: 'src/queues',
    outputFile: 'queue',
    template: 'queue',
    envVars: 'REDIS_URL=redis://localhost:6379',
  },
  bullmq: {
    description: 'BullMQ — fast, robust background job & message queue (Redis)',
    packages: 'bullmq',
    devPackages: '',
    outputDir: 'src/queues',
    outputFile: 'queue',
    template: 'queue',
    envVars: 'REDIS_URL=redis://localhost:6379',
  },
  zod: {
    description: 'Zod — TypeScript-first schema validation',
    packages: 'zod',
    devPackages: '',
    outputDir: 'src/utils',
    outputFile: 'validate',
    template: 'zod',
    envVars: null,
  },
  mailer: {
    description: 'Nodemailer — send emails via SMTP',
    packages: 'nodemailer',
    devPackages: '@types/nodemailer',
    outputDir: 'src/utils',
    outputFile: 'mailer',
    template: 'mailer',
    envVars: 'SMTP_HOST=smtp.gmail.com\nSMTP_PORT=587\nSMTP_USER=\nSMTP_PASS=',
  },
  stripe: {
    description: 'Stripe — payment processing SDK',
    packages: 'stripe',
    devPackages: '',
    outputDir: 'src/config',
    outputFile: 'stripe',
    template: 'stripe',
    envVars: 'STRIPE_SECRET_KEY=sk_test_\nSTRIPE_WEBHOOK_SECRET=whsec_',
  },
  ratelimit: {
    description: 'Rate limiting — protect endpoints from abuse (stack-aware)',
    packages: 'express-rate-limit',
    devPackages: '',
    outputDir: 'src/middlewares',
    outputFile: 'rateLimiter',
    template: 'ratelimit',
    envVars: null,
    stacks: {
      express: {
        packages: 'express-rate-limit',
        devPackages: '',
      },
      fastify: {
        packages: '@fastify/rate-limit',
        devPackages: '',
      },
      hono: {
        packages: 'hono-rate-limiter',
        devPackages: '',
      },
      koa: {
        packages: 'koa-ratelimit',
        devPackages: '@types/koa-ratelimit',
      },
    },
  },
  swagger: {
    description: 'API Documentation — interactive Swagger / OpenAPI docs (stack-aware)',
    packages: 'swagger-ui-express swagger-jsdoc',
    devPackages: '@types/swagger-ui-express @types/swagger-jsdoc',
    outputDir: 'src/config',
    outputFile: 'swagger',
    template: 'swagger',
    envVars: null,
    stacks: {
      express: {
        packages: 'swagger-ui-express swagger-jsdoc',
        devPackages: '@types/swagger-ui-express @types/swagger-jsdoc',
      },
      fastify: {
        packages: '@fastify/swagger @fastify/swagger-ui',
        devPackages: '',
      },
      hono: {
        packages: '@hono/zod-openapi @scalar/hono-api-reference',
        devPackages: '',
      },
      koa: {
        packages: 'koa2-swagger-ui swagger-jsdoc',
        devPackages: '@types/swagger-jsdoc',
      },
    },
  },
  socket: {
    description: 'Socket.IO — real-time bidirectional event-based communication',
    packages: 'socket.io',
    devPackages: '',
    outputDir: 'src/config',
    outputFile: 'socket',
    template: 'socket',
    envVars: null,
  },
  ci: {
    description: 'GitHub Actions — automated CI/CD test, lint, and build pipeline',
    isSpecial: true,
  },
  docker: {
    description: 'Docker — multi-stage Dockerfile & .dockerignore (Alpine, Debian, Ubuntu, Distroless)',
    isSpecial: true,
  },
  compose: {
    description: 'Docker Compose — multi-container stack with app, database, and Redis',
    isSpecial: true,
  },
  'docker-compose': {
    description: 'Docker Compose — multi-container stack with app, database, and Redis',
    isSpecial: true,
  },
};

/**
 * Resolve plugin metadata customized for the target runtime framework.
 *
 * @param {string} pluginName
 * @param {string} [runtime='express']
 * @returns {object|null}
 */
function getPluginConfig(pluginName, runtime = 'express') {
  const plugin = PLUGINS[pluginName];
  if (!plugin) return null;
  const normRuntime = (runtime || 'express').toLowerCase();
  const stack = plugin.stacks?.[normRuntime] || plugin.stacks?.express || {};
  return {
    ...plugin,
    ...stack,
    packages: stack.packages !== undefined ? stack.packages : plugin.packages,
    devPackages: stack.devPackages !== undefined ? stack.devPackages : plugin.devPackages,
  };
}

module.exports = { PLUGINS, getPluginConfig };
