/**
 * Plugin registry — maps plugin names to their metadata.
 * Each entry defines:
 *   - description: human-readable summary shown in the select prompt
 *   - packages: npm package(s) to install as --save
 *   - devPackages: npm package(s) to install as --save-dev (optional)
 *   - outputDir: where the scaffolded file goes (relative to project root)
 *   - outputFile: filename (without extension — extension added at runtime)
 *   - template: key in templates.js that holds the file content
 *   - envVars: string of env vars to append to .env (null if none)
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
    description: 'express-rate-limit — protect endpoints from abuse',
    packages: 'express-rate-limit',
    devPackages: '',
    outputDir: 'src/middlewares',
    outputFile: 'rateLimiter',
    template: 'ratelimit',
    envVars: null,
  },
  swagger: {
    description: 'Swagger UI — interactive API documentation',
    packages: 'swagger-ui-express swagger-jsdoc',
    devPackages: '@types/swagger-ui-express @types/swagger-jsdoc',
    outputDir: 'src/config',
    outputFile: 'swagger',
    template: 'swagger',
    envVars: null,
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
};

module.exports = { PLUGINS };
