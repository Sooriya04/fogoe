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
// RATE LIMIT (express-rate-limit)
// ─────────────────────────────────────────────

const ratelimit = {
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
// SWAGGER (swagger-ui-express + swagger-jsdoc)
// ─────────────────────────────────────────────

const swagger = {
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

module.exports = { redis, zod, mailer, stripe, ratelimit, swagger, socket };
