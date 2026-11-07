// Plugin code templates
// Each plugin provides JS (commonjs + module) and TypeScript variants.

// ─────────────────────────────────────────────
// REDIS (ioredis)
// ─────────────────────────────────────────────

const redis = {
  js: {
    commonjs: `const Redis = require('ioredis');

const client = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

client.on('connect', () => console.log('Redis connected'));
client.on('error', (err) => console.error('Redis error:', err));

module.exports = client;
`,
    module: `import Redis from 'ioredis';

const client = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

client.on('connect', () => console.log('Redis connected'));
client.on('error', (err) => console.error('Redis error:', err));

export default client;
`,
  },
  ts: `import Redis from 'ioredis';

const client = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

client.on('connect', () => console.log('Redis connected'));
client.on('error', (err: Error) => console.error('Redis error:', err));

export default client;
`,
  envVars: 'REDIS_URL=redis://localhost:6379',
};

// ─────────────────────────────────────────────
// ZOD (validation)
// ─────────────────────────────────────────────

const zod = {
  stacks: {
    express: {
      js: {
        commonjs: `const { z } = require('zod');

/**
 * Example: validate request body
 * const schema = z.object({ name: z.string(), age: z.number() });
 * const result = schema.safeParse(req.body);
 */

function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ errors: result.error.flatten().fieldErrors });
    }
    req.body = result.data;
    next();
  };
}

module.exports = { z, validate };
`,
        module: `import { z } from 'zod';

/**
 * Example: validate request body
 * const schema = z.object({ name: z.string(), age: z.number() });
 * const result = schema.safeParse(req.body);
 */

export function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ errors: result.error.flatten().fieldErrors });
    }
    req.body = result.data;
    next();
  };
}

export { z };
`,
      },
      ts: `import { z, ZodSchema } from 'zod';
import { Request, Response, NextFunction } from 'express';

/**
 * Example: validate request body
 * const schema = z.object({ name: z.string(), age: z.number() });
 * const result = schema.safeParse(req.body);
 */

export function validate(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ errors: result.error.flatten().fieldErrors });
    }
    req.body = result.data;
    next();
  };
}

export { z };
`,
    },
    fastify: {
      js: {
        commonjs: `const { z } = require('zod');

/**
 * Fastify preValidation hook / validator
 */
function validate(schema) {
  return async (req, reply) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return reply.status(400).send({ errors: result.error.flatten().fieldErrors });
    }
    req.body = result.data;
  };
}

module.exports = { z, validate };
`,
        module: `import { z } from 'zod';

/**
 * Fastify preValidation hook / validator
 */
export function validate(schema) {
  return async (req, reply) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return reply.status(400).send({ errors: result.error.flatten().fieldErrors });
    }
    req.body = result.data;
  };
}

export { z };
`,
      },
      ts: `import { z, ZodSchema } from 'zod';
import { FastifyRequest, FastifyReply } from 'fastify';

/**
 * Fastify preValidation hook / validator
 */
export function validate(schema: ZodSchema) {
  return async (req: FastifyRequest, reply: FastifyReply) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return reply.status(400).send({ errors: result.error.flatten().fieldErrors });
    }
    req.body = result.data;
  };
}

export { z };
`,
    },
    hono: {
      js: {
        commonjs: `const { z } = require('zod');

/**
 * Hono validation middleware
 */
function validate(schema) {
  return async (c, next) => {
    const body = await c.req.json().catch(() => ({}));
    const result = schema.safeParse(body);
    if (!result.success) {
      return c.json({ errors: result.error.flatten().fieldErrors }, 400);
    }
    c.set('validatedBody', result.data);
    await next();
  };
}

module.exports = { z, validate };
`,
        module: `import { z } from 'zod';

/**
 * Hono validation middleware
 */
export function validate(schema) {
  return async (c, next) => {
    const body = await c.req.json().catch(() => ({}));
    const result = schema.safeParse(body);
    if (!result.success) {
      return c.json({ errors: result.error.flatten().fieldErrors }, 400);
    }
    c.set('validatedBody', result.data);
    await next();
  };
}

export { z };
`,
      },
      ts: `import { z, ZodSchema } from 'zod';
import { Context, Next } from 'hono';

/**
 * Hono validation middleware
 */
export function validate(schema: ZodSchema) {
  return async (c: Context, next: Next) => {
    const body = await c.req.json().catch(() => ({}));
    const result = schema.safeParse(body);
    if (!result.success) {
      return c.json({ errors: result.error.flatten().fieldErrors }, 400);
    }
    c.set('validatedBody', result.data);
    await next();
  };
}

export { z };
`,
    },
    koa: {
      js: {
        commonjs: `const { z } = require('zod');

/**
 * Koa validation middleware
 */
function validate(schema) {
  return async (ctx, next) => {
    const body = ctx.request.body || {};
    const result = schema.safeParse(body);
    if (!result.success) {
      ctx.status = 400;
      ctx.body = { errors: result.error.flatten().fieldErrors };
      return;
    }
    ctx.request.body = result.data;
    await next();
  };
}

module.exports = { z, validate };
`,
        module: `import { z } from 'zod';

/**
 * Koa validation middleware
 */
export function validate(schema) {
  return async (ctx, next) => {
    const body = ctx.request.body || {};
    const result = schema.safeParse(body);
    if (!result.success) {
      ctx.status = 400;
      ctx.body = { errors: result.error.flatten().fieldErrors };
      return;
    }
    ctx.request.body = result.data;
    await next();
  };
}

export { z };
`,
      },
      ts: `import { z, ZodSchema } from 'zod';
import { Context, Next } from 'koa';

/**
 * Koa validation middleware
 */
export function validate(schema: ZodSchema) {
  return async (ctx: Context, next: Next) => {
    const body = (ctx.request as any).body || {};
    const result = schema.safeParse(body);
    if (!result.success) {
      ctx.status = 400;
      ctx.body = { errors: result.error.flatten().fieldErrors };
      return;
    }
    (ctx.request as any).body = result.data;
    await next();
  };
}

export { z };
`,
    },
  },
  js: {
    commonjs: `const { z } = require('zod');

/**
 * Example: validate request body
 * const schema = z.object({ name: z.string(), age: z.number() });
 * const result = schema.safeParse(req.body);
 */

function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ errors: result.error.flatten().fieldErrors });
    }
    req.body = result.data;
    next();
  };
}

module.exports = { z, validate };
`,
    module: `import { z } from 'zod';

/**
 * Example: validate request body
 * const schema = z.object({ name: z.string(), age: z.number() });
 * const result = schema.safeParse(req.body);
 */

export function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ errors: result.error.flatten().fieldErrors });
    }
    req.body = result.data;
    next();
  };
}

export { z };
`,
  },
  ts: `import { z, ZodSchema } from 'zod';
import { Request, Response, NextFunction } from 'express';

/**
 * Example: validate request body
 * const schema = z.object({ name: z.string(), age: z.number() });
 * const result = schema.safeParse(req.body);
 */

export function validate(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ errors: result.error.flatten().fieldErrors });
    }
    req.body = result.data;
    next();
  };
}

export { z };
`,
  envVars: null,
};

// ─────────────────────────────────────────────
// MAILER (nodemailer)
// ─────────────────────────────────────────────

const mailer = {
  js: {
    commonjs: `const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

/**
 * Send an email
 * @param {string} to - Recipient email
 * @param {string} subject - Email subject
 * @param {string} html - Email HTML body
 */
async function sendMail(to, subject, html) {
  return transporter.sendMail({ from: process.env.SMTP_USER, to, subject, html });
}

module.exports = { transporter, sendMail };
`,
    module: `import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

/**
 * Send an email
 */
export async function sendMail(to, subject, html) {
  return transporter.sendMail({ from: process.env.SMTP_USER, to, subject, html });
}

export { transporter };
`,
  },
  ts: `import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

/**
 * Send an email
 */
export async function sendMail(to: string, subject: string, html: string): Promise<void> {
  await transporter.sendMail({ from: process.env.SMTP_USER, to, subject, html });
}

export { transporter };
`,
  envVars: 'SMTP_HOST=smtp.gmail.com\nSMTP_PORT=587\nSMTP_USER=\nSMTP_PASS=',
};

// ─────────────────────────────────────────────
// STRIPE
// ─────────────────────────────────────────────

const stripe = {
  js: {
    commonjs: `const Stripe = require('stripe');

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-12-18.acacia',
});

module.exports = stripe;
`,
    module: `import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-12-18.acacia',
});

export default stripe;
`,
  },
  ts: `import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-12-18.acacia',
});

export default stripe;
`,
  envVars: 'STRIPE_SECRET_KEY=sk_test_\nSTRIPE_WEBHOOK_SECRET=whsec_',
};

// ─────────────────────────────────────────────
// RATE LIMIT (stack-aware)
// ─────────────────────────────────────────────

const ratelimit = {
  stacks: {
    express: {
      js: {
        commonjs: `const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
});

module.exports = limiter;
`,
        module: `import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
});

export default limiter;
`,
      },
      ts: `import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
});

export default limiter;
`,
    },
    fastify: {
      js: {
        commonjs: `const rateLimit = require('@fastify/rate-limit');

async function setupRateLimit(fastify) {
  await fastify.register(rateLimit, {
    max: 100,
    timeWindow: '15 minutes',
  });
}

module.exports = setupRateLimit;
`,
        module: `import rateLimit from '@fastify/rate-limit';

export default async function setupRateLimit(fastify) {
  await fastify.register(rateLimit, {
    max: 100,
    timeWindow: '15 minutes',
  });
}
`,
      },
      ts: `import rateLimit from '@fastify/rate-limit';
import { FastifyInstance } from 'fastify';

export default async function setupRateLimit(fastify: FastifyInstance) {
  await fastify.register(rateLimit, {
    max: 100,
    timeWindow: '15 minutes',
  });
}
`,
    },
    hono: {
      js: {
        commonjs: `const { rateLimiter } = require('hono-rate-limiter');

const limiter = rateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 100,
  standardHeaders: 'draft-6',
  keyGenerator: (c) => c.req.header('x-forwarded-for') || 'anon',
});

module.exports = limiter;
`,
        module: `import { rateLimiter } from 'hono-rate-limiter';

const limiter = rateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 100,
  standardHeaders: 'draft-6',
  keyGenerator: (c) => c.req.header('x-forwarded-for') || 'anon',
});

export default limiter;
`,
      },
      ts: `import { rateLimiter } from 'hono-rate-limiter';

export const limiter = rateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 100,
  standardHeaders: 'draft-6',
  keyGenerator: (c) => c.req.header('x-forwarded-for') || 'anon',
});

export default limiter;
`,
    },
    koa: {
      js: {
        commonjs: `const rateLimit = require('koa-ratelimit');

const db = new Map();

const limiter = rateLimit({
  driver: 'memory',
  db,
  duration: 15 * 60 * 1000, // 15 minutes
  max: 100,
  id: (ctx) => ctx.ip,
  errorMessage: 'Too many requests, please try again later.',
  disableHeader: false,
});

module.exports = limiter;
`,
        module: `import rateLimit from 'koa-ratelimit';

const db = new Map();

const limiter = rateLimit({
  driver: 'memory',
  db,
  duration: 15 * 60 * 1000, // 15 minutes
  max: 100,
  id: (ctx) => ctx.ip,
  errorMessage: 'Too many requests, please try again later.',
  disableHeader: false,
});

export default limiter;
`,
      },
      ts: `import rateLimit from 'koa-ratelimit';
import { Context } from 'koa';

const db = new Map();

const limiter = rateLimit({
  driver: 'memory',
  db,
  duration: 15 * 60 * 1000, // 15 minutes
  max: 100,
  id: (ctx: Context) => ctx.ip,
  errorMessage: 'Too many requests, please try again later.',
  disableHeader: false,
});

export default limiter;
`,
    },
  },
  js: {
    commonjs: `const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
});

module.exports = limiter;
`,
    module: `import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
});

export default limiter;
`,
  },
  ts: `import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
});

export default limiter;
`,
  envVars: null,
};

// ─────────────────────────────────────────────
// SWAGGER / API DOCS (stack-aware)
// ─────────────────────────────────────────────

const swagger = {
  stacks: {
    express: {
      js: {
        commonjs: `const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'API Docs',
      version: '1.0.0',
    },
  },
  apis: ['./src/routes/*.js'],
};

const spec = swaggerJsdoc(options);

module.exports = { swaggerUi, spec };
`,
        module: `import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'API Docs',
      version: '1.0.0',
    },
  },
  apis: ['./src/routes/*.js'],
};

const spec = swaggerJsdoc(options);

export { swaggerUi, spec };
`,
      },
      ts: `import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'API Docs',
      version: '1.0.0',
    },
  },
  apis: ['./src/routes/*.ts'],
};

const spec = swaggerJsdoc(options);

export { swaggerUi, spec };
`,
    },
    fastify: {
      js: {
        commonjs: `const swagger = require('@fastify/swagger');
const swaggerUi = require('@fastify/swagger-ui');

async function setupSwagger(fastify) {
  await fastify.register(swagger, {
    openapi: {
      info: {
        title: 'API Docs',
        version: '1.0.0',
      },
    },
  });

  await fastify.register(swaggerUi, {
    routePrefix: '/api-docs',
    uiConfig: {
      docExpansion: 'list',
      deepLinking: false,
    },
  });
}

module.exports = setupSwagger;
`,
        module: `import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';

export default async function setupSwagger(fastify) {
  await fastify.register(swagger, {
    openapi: {
      info: {
        title: 'API Docs',
        version: '1.0.0',
      },
    },
  });

  await fastify.register(swaggerUi, {
    routePrefix: '/api-docs',
    uiConfig: {
      docExpansion: 'list',
      deepLinking: false,
    },
  });
}
`,
      },
      ts: `import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { FastifyInstance } from 'fastify';

export default async function setupSwagger(fastify: FastifyInstance) {
  await fastify.register(swagger, {
    openapi: {
      info: {
        title: 'API Docs',
        version: '1.0.0',
      },
    },
  });

  await fastify.register(swaggerUi, {
    routePrefix: '/api-docs',
    uiConfig: {
      docExpansion: 'list',
      deepLinking: false,
    },
  });
}
`,
    },
    hono: {
      js: {
        commonjs: `const { apiReference } = require('@scalar/hono-api-reference');

function setupSwagger(app) {
  app.get(
    '/api-docs',
    apiReference({
      theme: 'purple',
      spec: {
        url: '/doc',
      },
    })
  );
}

module.exports = setupSwagger;
`,
        module: `import { apiReference } from '@scalar/hono-api-reference';

export function setupSwagger(app) {
  app.get(
    '/api-docs',
    apiReference({
      theme: 'purple',
      spec: {
        url: '/doc',
      },
    })
  );
}

export default setupSwagger;
`,
      },
      ts: `import { apiReference } from '@scalar/hono-api-reference';

export function setupSwagger(app: any) {
  app.get(
    '/api-docs',
    apiReference({
      theme: 'purple',
      spec: {
        url: '/doc',
      },
    })
  );
}

export default setupSwagger;
`,
    },
    koa: {
      js: {
        commonjs: `const { koaSwagger } = require('koa2-swagger-ui');
const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'API Docs',
      version: '1.0.0',
    },
  },
  apis: ['./src/routes/*.js'],
};

const spec = swaggerJsdoc(options);

const swaggerMiddleware = koaSwagger({
  routePrefix: '/api-docs',
  swaggerOptions: { spec },
});

module.exports = { swaggerMiddleware, spec };
`,
        module: `import { koaSwagger } from 'koa2-swagger-ui';
import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'API Docs',
      version: '1.0.0',
    },
  },
  apis: ['./src/routes/*.js'],
};

const spec = swaggerJsdoc(options);

export const swaggerMiddleware = koaSwagger({
  routePrefix: '/api-docs',
  swaggerOptions: { spec },
});

export { spec };
`,
      },
      ts: `import { koaSwagger } from 'koa2-swagger-ui';
import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'API Docs',
      version: '1.0.0',
    },
  },
  apis: ['./src/routes/*.ts'],
};

const spec = swaggerJsdoc(options);

export const swaggerMiddleware = koaSwagger({
  routePrefix: '/api-docs',
  swaggerOptions: { spec },
});

export { spec };
`,
    },
  },
  js: {
    commonjs: `const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'API Docs',
      version: '1.0.0',
    },
  },
  apis: ['./src/routes/*.js'],
};

const spec = swaggerJsdoc(options);

module.exports = { swaggerUi, spec };
`,
    module: `import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'API Docs',
      version: '1.0.0',
    },
  },
  apis: ['./src/routes/*.js'],
};

const spec = swaggerJsdoc(options);

export { swaggerUi, spec };
`,
  },
  ts: `import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'API Docs',
      version: '1.0.0',
    },
  },
  apis: ['./src/routes/*.ts'],
};

const spec = swaggerJsdoc(options);

export { swaggerUi, spec };
`,
  envVars: null,
};

// ─────────────────────────────────────────────
// SOCKET.IO
// ─────────────────────────────────────────────

const socket = {
  js: {
    commonjs: `const { Server } = require('socket.io');

/**
 * Attach Socket.IO to an HTTP server
 * Usage in server.js:
 *   const http = require('http');
 *   const server = http.createServer(app);
 *   const io = setupSocket(server);
 *   server.listen(PORT);
 */
function setupSocket(server) {
  const io = new Server(server, {
    cors: { origin: '*' },
  });

  io.on('connection', (socket) => {
    console.log('Socket connected:', socket.id);

    socket.on('disconnect', () => {
      console.log('Socket disconnected:', socket.id);
    });
  });

  return io;
}

module.exports = { setupSocket };
`,
    module: `import { Server } from 'socket.io';

/**
 * Attach Socket.IO to an HTTP server
 */
export function setupSocket(server) {
  const io = new Server(server, {
    cors: { origin: '*' },
  });

  io.on('connection', (socket) => {
    console.log('Socket connected:', socket.id);

    socket.on('disconnect', () => {
      console.log('Socket disconnected:', socket.id);
    });
  });

  return io;
}
`,
  },
  ts: `import { Server, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';

/**
 * Attach Socket.IO to an HTTP server
 */
export function setupSocket(server: HttpServer) {
  const io = new Server(server, {
    cors: { origin: '*' },
  });

  io.on('connection', (socket: Socket) => {
    console.log('Socket connected:', socket.id);

    socket.on('disconnect', () => {
      console.log('Socket disconnected:', socket.id);
    });
  });

  return io;
}
`,
  envVars: null,
};

// ─────────────────────────────────────────────
// QUEUE (bullmq)
// ─────────────────────────────────────────────

const queue = {
  js: {
    commonjs: `const { Queue, Worker } = require('bullmq');

const redisUrl = new URL(process.env.REDIS_URL || 'redis://127.0.0.1:6379');
const connection = {
  host: redisUrl.hostname || '127.0.0.1',
  port: Number(redisUrl.port) || 6379,
  password: redisUrl.password || undefined,
  maxRetriesPerRequest: null,
};

const defaultQueue = new Queue('default', { connection });

const defaultWorker = new Worker(
  'default',
  async (job) => {
    console.log(\`[Queue] Processing job \${job.id} (\${job.name})\`);
    // TODO: Process async jobs here
    return { status: 'completed' };
  },
  { connection }
);

defaultWorker.on('completed', (job) => {
  console.log(\`[Queue] Job \${job.id} completed\`);
});

defaultWorker.on('failed', (job, err) => {
  console.error(\`[Queue] Job \${job ? job.id : 'unknown'} failed:\`, err.message);
});

async function addJob(name, data = {}, opts = {}) {
  return defaultQueue.add(name, data, opts);
}

module.exports = {
  defaultQueue,
  defaultWorker,
  addJob,
};
`,
    module: `import { Queue, Worker } from 'bullmq';

const redisUrl = new URL(process.env.REDIS_URL || 'redis://127.0.0.1:6379');
const connection = {
  host: redisUrl.hostname || '127.0.0.1',
  port: Number(redisUrl.port) || 6379,
  password: redisUrl.password || undefined,
  maxRetriesPerRequest: null,
};

export const defaultQueue = new Queue('default', { connection });

export const defaultWorker = new Worker(
  'default',
  async (job) => {
    console.log(\`[Queue] Processing job \${job.id} (\${job.name})\`);
    // TODO: Process async jobs here
    return { status: 'completed' };
  },
  { connection }
);

defaultWorker.on('completed', (job) => {
  console.log(\`[Queue] Job \${job.id} completed\`);
});

defaultWorker.on('failed', (job, err) => {
  console.error(\`[Queue] Job \${job?.id} failed:\`, err.message);
});

export async function addJob(name, data = {}, opts = {}) {
  return defaultQueue.add(name, data, opts);
}

export default {
  defaultQueue,
  defaultWorker,
  addJob,
};
`,
  },
  ts: `import { Queue, Worker, Job } from 'bullmq';

const redisUrl = new URL(process.env.REDIS_URL || 'redis://127.0.0.1:6379');
const connection = {
  host: redisUrl.hostname || '127.0.0.1',
  port: Number(redisUrl.port) || 6379,
  password: redisUrl.password || undefined,
  maxRetriesPerRequest: null,
};

export const defaultQueue = new Queue('default', { connection });

export const defaultWorker = new Worker(
  'default',
  async (job: Job) => {
    console.log(\`[Queue] Processing job \${job.id} (\${job.name})\`);
    // TODO: Process async jobs here
    return { status: 'completed' };
  },
  { connection }
);

defaultWorker.on('completed', (job: Job) => {
  console.log(\`[Queue] Job \${job.id} completed\`);
});

defaultWorker.on('failed', (job: Job | undefined, err: Error) => {
  console.error(\`[Queue] Job \${job?.id} failed:\`, err.message);
});

export async function addJob<T = any>(name: string, data: T = {} as T, opts = {}) {
  return defaultQueue.add(name, data, opts);
}

export default {
  defaultQueue,
  defaultWorker,
  addJob,
};
`,
  envVars: 'REDIS_URL=redis://localhost:6379',
};

module.exports = { redis, zod, mailer, stripe, ratelimit, swagger, socket, queue, bullmq: queue };
