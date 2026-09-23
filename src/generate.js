const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

function capitalize(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function detectDatabase() {
  if (fs.existsSync(path.join(process.cwd(), 'prisma/schema.prisma'))) {
    return 'prisma';
  }
  if (fs.existsSync(path.join(process.cwd(), 'drizzle.config.ts')) || fs.existsSync(path.join(process.cwd(), 'drizzle.config.js'))) {
    return 'drizzle';
  }
  const dbConfigPathJs = path.join(process.cwd(), 'src/config/db.js');
  const dbConfigPathTs = path.join(process.cwd(), 'src/config/db.ts');
  const dbFile = fs.existsSync(dbConfigPathJs) ? dbConfigPathJs : (fs.existsSync(dbConfigPathTs) ? dbConfigPathTs : null);
  if (dbFile) {
    const content = fs.readFileSync(dbFile, 'utf8');
    if (content.includes('mongoose')) return 'mongodb';
    if (content.includes('drizzle')) return 'drizzle';
    if (content.includes('mysql2')) return 'mysql';
    if (content.includes('better-sqlite3')) return 'sqlite';
    if (content.includes('pg')) return 'postgresql';
  }

  const configPath = path.join(process.cwd(), 'fogoe.config.json');
  if (fs.existsSync(configPath)) {
    try {
      const cfg = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      if (cfg.defaults && cfg.defaults.database) {
        return cfg.defaults.database;
      }
    } catch {}
  }
  return 'none';
}

function generateRouteFile({ rawName, capName, ext, type, language, runtime, importSuffix, isCrud = false }) {
  const routeDir = path.join(process.cwd(), 'src/routes');
  fs.mkdirSync(routeDir, { recursive: true });
  const filePath = path.join(routeDir, `${rawName}.${ext}`);

  if (fs.existsSync(filePath)) {
    console.error(chalk.yellow(`\n  ⚠ File already exists: src/routes/${rawName}.${ext}`));
    process.exit(1);
  }

  let template = '';
  if (!isCrud) {
    // Single index route
    if (runtime === 'express') {
      if (type === 'cjs') {
        if (language === 'ts') {
          template = `import express, { Router } from 'express';
import { index } from '../controllers/${rawName}controller';

const router: Router = express.Router();

router.get('/', index);

export = router;`;
        } else {
          template = `const express = require('express');
const router = express.Router();
const controller = require('../controllers/${rawName}controller');

router.get('/', controller.index);

module.exports = router;`;
        }
      } else {
        template = `import express from 'express';
const router = express.Router();
import { index } from '../controllers/${rawName}controller${importSuffix}';

router.get('/', index);

export default router;`;
      }
    } else if (runtime === 'fastify') {
      if (type === 'cjs') {
        if (language === 'ts') {
          template = `import { FastifyInstance } from 'fastify';
import { index } from '../controllers/${rawName}controller';

async function ${rawName}Routes(fastify: FastifyInstance): Promise<void> {
  fastify.get('/', index);
}

export = ${rawName}Routes;`;
        } else {
          template = `const controller = require('../controllers/${rawName}controller');

async function ${rawName}Routes(fastify, options) {
  fastify.get('/', controller.index);
}

module.exports = ${rawName}Routes;`;
        }
      } else {
        if (language === 'ts') {
          template = `import { FastifyInstance } from 'fastify';
import { index } from '../controllers/${rawName}controller${importSuffix}';

export default async function ${rawName}Routes(fastify: FastifyInstance): Promise<void> {
  fastify.get('/', index);
} `;
        } else {
          template = `import { index } from '../controllers/${rawName}controller${importSuffix}';

export default async function ${rawName}Routes(fastify, options) {
  fastify.get('/', index);
} `;
        }
      }
    } else if (runtime === 'hono') {
      if (type === 'cjs') {
        if (language === 'ts') {
          template = `import { Hono } from 'hono';
import { index } from '../controllers/${rawName}controller';

const router = new Hono();
router.get('/', index);

export = router;`;
        } else {
          template = `const { Hono } = require('hono');
const controller = require('../controllers/${rawName}controller');

const router = new Hono();
router.get('/', controller.index);

module.exports = router;`;
        }
      } else {
        template = `import { Hono } from 'hono';
import { index } from '../controllers/${rawName}controller${importSuffix}';

const router = new Hono();
router.get('/', index);

export default router;`;
      }
    } else if (runtime === 'koa') {
      if (type === 'cjs') {
        if (language === 'ts') {
          template = `import Router from '@koa/router';
import { index } from '../controllers/${rawName}controller';

const router = new Router();
router.get('/', index);

export = router;`;
        } else {
          template = `const Router = require('@koa/router');
const controller = require('../controllers/${rawName}controller');

const router = new Router();
router.get('/', controller.index);

module.exports = router;`;
        }
      } else {
        template = `import Router from '@koa/router';
import { index } from '../controllers/${rawName}controller${importSuffix}';

const router = new Router();
router.get('/', index);

export default router;`;
      }
    }
  } else {
    // Full CRUD routes: GET /, GET /:id, POST /, PUT /:id, DELETE /:id
    if (runtime === 'express') {
      if (type === 'cjs') {
        if (language === 'ts') {
          template = `import express, { Router } from 'express';
import { getAll, getById, create, update, remove } from '../controllers/${rawName}controller';

const router: Router = express.Router();

router.get('/', getAll);
router.get('/:id', getById);
router.post('/', create);
router.put('/:id', update);
router.delete('/:id', remove);

export = router;`;
        } else {
          template = `const express = require('express');
const router = express.Router();
const controller = require('../controllers/${rawName}controller');

router.get('/', controller.getAll);
router.get('/:id', controller.getById);
router.post('/', controller.create);
router.put('/:id', controller.update);
router.delete('/:id', controller.remove);

module.exports = router;`;
        }
      } else {
        template = `import express from 'express';
import { getAll, getById, create, update, remove } from '../controllers/${rawName}controller${importSuffix}';

const router = express.Router();

router.get('/', getAll);
router.get('/:id', getById);
router.post('/', create);
router.put('/:id', update);
router.delete('/:id', remove);

export default router;`;
      }
    } else if (runtime === 'fastify') {
      if (type === 'cjs') {
        if (language === 'ts') {
          template = `import { FastifyInstance } from 'fastify';
import { getAll, getById, create, update, remove } from '../controllers/${rawName}controller';

async function ${rawName}Routes(fastify: FastifyInstance): Promise<void> {
  fastify.get('/', getAll);
  fastify.get('/:id', getById);
  fastify.post('/', create);
  fastify.put('/:id', update);
  fastify.delete('/:id', remove);
}

export = ${rawName}Routes;`;
        } else {
          template = `const controller = require('../controllers/${rawName}controller');

async function ${rawName}Routes(fastify, options) {
  fastify.get('/', controller.getAll);
  fastify.get('/:id', controller.getById);
  fastify.post('/', controller.create);
  fastify.put('/:id', controller.update);
  fastify.delete('/:id', controller.remove);
}

module.exports = ${rawName}Routes;`;
        }
      } else {
        if (language === 'ts') {
          template = `import { FastifyInstance } from 'fastify';
import { getAll, getById, create, update, remove } from '../controllers/${rawName}controller${importSuffix}';

export default async function ${rawName}Routes(fastify: FastifyInstance): Promise<void> {
  fastify.get('/', getAll);
  fastify.get('/:id', getById);
  fastify.post('/', create);
  fastify.put('/:id', update);
  fastify.delete('/:id', remove);
}`;
        } else {
          template = `import { getAll, getById, create, update, remove } from '../controllers/${rawName}controller${importSuffix}';

export default async function ${rawName}Routes(fastify, options) {
  fastify.get('/', getAll);
  fastify.get('/:id', getById);
  fastify.post('/', create);
  fastify.put('/:id', update);
  fastify.delete('/:id', remove);
}`;
        }
      }
    } else if (runtime === 'hono') {
      if (type === 'cjs') {
        if (language === 'ts') {
          template = `import { Hono } from 'hono';
import { getAll, getById, create, update, remove } from '../controllers/${rawName}controller';

const router = new Hono();
router.get('/', getAll);
router.get('/:id', getById);
router.post('/', create);
router.put('/:id', update);
router.delete('/:id', remove);

export = router;`;
        } else {
          template = `const { Hono } = require('hono');
const controller = require('../controllers/${rawName}controller');

const router = new Hono();
router.get('/', controller.getAll);
router.get('/:id', controller.getById);
router.post('/', controller.create);
router.put('/:id', controller.update);
router.delete('/:id', controller.remove);

module.exports = router;`;
        }
      } else {
        template = `import { Hono } from 'hono';
import { getAll, getById, create, update, remove } from '../controllers/${rawName}controller${importSuffix}';

const router = new Hono();
router.get('/', getAll);
router.get('/:id', getById);
router.post('/', create);
router.put('/:id', update);
router.delete('/:id', remove);

export default router;`;
      }
    } else if (runtime === 'koa') {
      if (type === 'cjs') {
        if (language === 'ts') {
          template = `import Router from '@koa/router';
import { getAll, getById, create, update, remove } from '../controllers/${rawName}controller';

const router = new Router();
router.get('/', getAll);
router.get('/:id', getById);
router.post('/', create);
router.put('/:id', update);
router.delete('/:id', remove);

export = router;`;
        } else {
          template = `const Router = require('@koa/router');
const controller = require('../controllers/${rawName}controller');

const router = new Router();
router.get('/', controller.getAll);
router.get('/:id', controller.getById);
router.post('/', controller.create);
router.put('/:id', controller.update);
router.delete('/:id', controller.remove);

module.exports = router;`;
        }
      } else {
        template = `import Router from '@koa/router';
import { getAll, getById, create, update, remove } from '../controllers/${rawName}controller${importSuffix}';

const router = new Router();
router.get('/', getAll);
router.get('/:id', getById);
router.post('/', create);
router.put('/:id', update);
router.delete('/:id', remove);

export default router;`;
      }
    }
  }

  fs.writeFileSync(filePath, template.trim() + '\n');
  console.log(chalk.green(`  ✓ Generated route: src/routes/${rawName}.${ext}`));
}

function generateControllerFile({ rawName, capName, ext, type, language, runtime, isCrud = false }) {
  const controllerDir = path.join(process.cwd(), 'src/controllers');
  fs.mkdirSync(controllerDir, { recursive: true });
  const filePath = path.join(controllerDir, `${rawName}controller.${ext}`);

  if (fs.existsSync(filePath)) {
    console.error(chalk.yellow(`\n  ⚠ File already exists: src/controllers/${rawName}controller.${ext}`));
    process.exit(1);
  }

  let template = '';
  if (!isCrud) {
    // Single index action
    if (runtime === 'express') {
      if (language === 'ts') {
        template = `import { Request, Response } from 'express';

export function index(req: Request, res: Response): void {
  res.send('${capName} index');
}`;
      } else if (type === 'esm') {
        template = `export function index(req, res) {
  res.send('${capName} index');
}`;
      } else {
        template = `function index(req, res) {
  res.send('${capName} index');
}

module.exports = { index };`;
      }
    } else if (runtime === 'fastify') {
      if (language === 'ts') {
        template = `import { FastifyRequest, FastifyReply } from 'fastify';

export async function index(req: FastifyRequest, reply: FastifyReply): Promise<void> {
  reply.type('text/plain').send('${capName} index');
}`;
      } else if (type === 'esm') {
        template = `export async function index(req, reply) {
  reply.type('text/plain').send('${capName} index');
}`;
      } else {
        template = `async function index(req, reply) {
  reply.type('text/plain').send('${capName} index');
}

module.exports = { index };`;
      }
    } else if (runtime === 'hono') {
      if (language === 'ts') {
        template = `import { Context } from 'hono';

export function index(c: Context) {
  return c.text('${capName} index');
}`;
      } else if (type === 'esm') {
        template = `export function index(c) {
  return c.text('${capName} index');
}`;
      } else {
        template = `function index(c) {
  return c.text('${capName} index');
}

module.exports = { index };`;
      }
    } else if (runtime === 'koa') {
      if (language === 'ts') {
        template = `import { Context } from 'koa';

export function index(ctx: Context): void {
  ctx.body = '${capName} index';
}`;
      } else if (type === 'esm') {
        template = `export function index(ctx) {
  ctx.body = '${capName} index';
}`;
      } else {
        template = `function index(ctx) {
  ctx.body = '${capName} index';
}

module.exports = { index };`;
      }
    }
  } else {
    // Full CRUD actions: getAll, getById, create, update, remove
    if (runtime === 'express') {
      if (language === 'ts') {
        template = `import { Request, Response } from 'express';

export async function getAll(req: Request, res: Response): Promise<void> {
  res.json({ message: 'Get all ${rawName}s', data: [] });
}

export async function getById(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  res.json({ message: \`Get ${rawName} \${id}\`, data: { id } });
}

export async function create(req: Request, res: Response): Promise<void> {
  const payload = req.body;
  res.status(201).json({ message: 'Create ${rawName}', data: payload });
}

export async function update(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const payload = req.body;
  res.json({ message: \`Update ${rawName} \${id}\`, data: { id, ...payload } });
}

export async function remove(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  res.json({ message: \`Delete ${rawName} \${id}\` });
}`;
      } else if (type === 'esm') {
        template = `export async function getAll(req, res) {
  res.json({ message: 'Get all ${rawName}s', data: [] });
}

export async function getById(req, res) {
  const { id } = req.params;
  res.json({ message: \`Get ${rawName} \${id}\`, data: { id } });
}

export async function create(req, res) {
  const payload = req.body;
  res.status(201).json({ message: 'Create ${rawName}', data: payload });
}

export async function update(req, res) {
  const { id } = req.params;
  const payload = req.body;
  res.json({ message: \`Update ${rawName} \${id}\`, data: { id, ...payload } });
}

export async function remove(req, res) {
  const { id } = req.params;
  res.json({ message: \`Delete ${rawName} \${id}\` });
}`;
      } else {
        template = `async function getAll(req, res) {
  res.json({ message: 'Get all ${rawName}s', data: [] });
}

async function getById(req, res) {
  const { id } = req.params;
  res.json({ message: \`Get ${rawName} \${id}\`, data: { id } });
}

async function create(req, res) {
  const payload = req.body;
  res.status(201).json({ message: 'Create ${rawName}', data: payload });
}

async function update(req, res) {
  const { id } = req.params;
  const payload = req.body;
  res.json({ message: \`Update ${rawName} \${id}\`, data: { id, ...payload } });
}

async function remove(req, res) {
  const { id } = req.params;
  res.json({ message: \`Delete ${rawName} \${id}\` });
}

module.exports = { getAll, getById, create, update, remove };`;
      }
    } else if (runtime === 'fastify') {
      if (language === 'ts') {
        template = `import { FastifyRequest, FastifyReply } from 'fastify';

export async function getAll(req: FastifyRequest, reply: FastifyReply): Promise<void> {
  reply.send({ message: 'Get all ${rawName}s', data: [] });
}

export async function getById(req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply): Promise<void> {
  const { id } = req.params;
  reply.send({ message: \`Get ${rawName} \${id}\`, data: { id } });
}

export async function create(req: FastifyRequest, reply: FastifyReply): Promise<void> {
  const payload = req.body;
  reply.status(201).send({ message: 'Create ${rawName}', data: payload });
}

export async function update(req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply): Promise<void> {
  const { id } = req.params;
  const payload = req.body;
  reply.send({ message: \`Update ${rawName} \${id}\`, data: { id, ...(payload as object) } });
}

export async function remove(req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply): Promise<void> {
  const { id } = req.params;
  reply.send({ message: \`Delete ${rawName} \${id}\` });
}`;
      } else if (type === 'esm') {
        template = `export async function getAll(req, reply) {
  reply.send({ message: 'Get all ${rawName}s', data: [] });
}

export async function getById(req, reply) {
  const { id } = req.params;
  reply.send({ message: \`Get ${rawName} \${id}\`, data: { id } });
}

export async function create(req, reply) {
  const payload = req.body;
  reply.status(201).send({ message: 'Create ${rawName}', data: payload });
}

export async function update(req, reply) {
  const { id } = req.params;
  const payload = req.body;
  reply.send({ message: \`Update ${rawName} \${id}\`, data: { id, ...payload } });
}

export async function remove(req, reply) {
  const { id } = req.params;
  reply.send({ message: \`Delete ${rawName} \${id}\` });
}`;
      } else {
        template = `async function getAll(req, reply) {
  reply.send({ message: 'Get all ${rawName}s', data: [] });
}

async function getById(req, reply) {
  const { id } = req.params;
  reply.send({ message: \`Get ${rawName} \${id}\`, data: { id } });
}

async function create(req, reply) {
  const payload = req.body;
  reply.status(201).send({ message: 'Create ${rawName}', data: payload });
}

async function update(req, reply) {
  const { id } = req.params;
  const payload = req.body;
  reply.send({ message: \`Update ${rawName} \${id}\`, data: { id, ...payload } });
}

async function remove(req, reply) {
  const { id } = req.params;
  reply.send({ message: \`Delete ${rawName} \${id}\` });
}

module.exports = { getAll, getById, create, update, remove };`;
      }
    } else if (runtime === 'hono') {
      if (language === 'ts') {
        template = `import { Context } from 'hono';

export function getAll(c: Context) {
  return c.json({ message: 'Get all ${rawName}s', data: [] });
}

export function getById(c: Context) {
  const id = c.req.param('id');
  return c.json({ message: \`Get ${rawName} \${id}\`, data: { id } });
}

export async function create(c: Context) {
  const payload = await c.req.json().catch(() => ({}));
  return c.json({ message: 'Create ${rawName}', data: payload }, 201);
}

export async function update(c: Context) {
  const id = c.req.param('id');
  const payload = await c.req.json().catch(() => ({}));
  return c.json({ message: \`Update ${rawName} \${id}\`, data: { id, ...payload } });
}

export function remove(c: Context) {
  const id = c.req.param('id');
  return c.json({ message: \`Delete ${rawName} \${id}\` });
}`;
      } else if (type === 'esm') {
        template = `export function getAll(c) {
  return c.json({ message: 'Get all ${rawName}s', data: [] });
}

export function getById(c) {
  const id = c.req.param('id');
  return c.json({ message: \`Get ${rawName} \${id}\`, data: { id } });
}

export async function create(c) {
  const payload = await c.req.json().catch(() => ({}));
  return c.json({ message: 'Create ${rawName}', data: payload }, 201);
}

export async function update(c) {
  const id = c.req.param('id');
  const payload = await c.req.json().catch(() => ({}));
  return c.json({ message: \`Update ${rawName} \${id}\`, data: { id, ...payload } });
}

export function remove(c) {
  const id = c.req.param('id');
  return c.json({ message: \`Delete ${rawName} \${id}\` });
}`;
      } else {
        template = `function getAll(c) {
  return c.json({ message: 'Get all ${rawName}s', data: [] });
}

function getById(c) {
  const id = c.req.param('id');
  return c.json({ message: \`Get ${rawName} \${id}\`, data: { id } });
}

async function create(c) {
  const payload = await c.req.json().catch(() => ({}));
  return c.json({ message: 'Create ${rawName}', data: payload }, 201);
}

async function update(c) {
  const id = c.req.param('id');
  const payload = await c.req.json().catch(() => ({}));
  return c.json({ message: \`Update ${rawName} \${id}\`, data: { id, ...payload } });
}

function remove(c) {
  const id = c.req.param('id');
  return c.json({ message: \`Delete ${rawName} \${id}\` });
}

module.exports = { getAll, getById, create, update, remove };`;
      }
    } else if (runtime === 'koa') {
      if (language === 'ts') {
        template = `import { Context } from 'koa';

export function getAll(ctx: Context): void {
  ctx.body = { message: 'Get all ${rawName}s', data: [] };
}

export function getById(ctx: Context): void {
  const { id } = ctx.params;
  ctx.body = { message: \`Get ${rawName} \${id}\`, data: { id } };
}

export function create(ctx: Context): void {
  const payload = (ctx.request as any).body;
  ctx.status = 201;
  ctx.body = { message: 'Create ${rawName}', data: payload };
}

export function update(ctx: Context): void {
  const { id } = ctx.params;
  const payload = (ctx.request as any).body;
  ctx.body = { message: \`Update ${rawName} \${id}\`, data: { id, ...payload } };
}

export function remove(ctx: Context): void {
  const { id } = ctx.params;
  ctx.body = { message: \`Delete ${rawName} \${id}\` };
}`;
      } else if (type === 'esm') {
        template = `export function getAll(ctx) {
  ctx.body = { message: 'Get all ${rawName}s', data: [] };
}

export function getById(ctx) {
  const { id } = ctx.params;
  ctx.body = { message: \`Get ${rawName} \${id}\`, data: { id } };
}

export function create(ctx) {
  const payload = ctx.request.body;
  ctx.status = 201;
  ctx.body = { message: 'Create ${rawName}', data: payload };
}

export function update(ctx) {
  const { id } = ctx.params;
  const payload = ctx.request.body;
  ctx.body = { message: \`Update ${rawName} \${id}\`, data: { id, ...payload } };
}

export function remove(ctx) {
  const { id } = ctx.params;
  ctx.body = { message: \`Delete ${rawName} \${id}\` };
}`;
      } else {
        template = `function getAll(ctx) {
  ctx.body = { message: 'Get all ${rawName}s', data: [] };
}

function getById(ctx) {
  const { id } = ctx.params;
  ctx.body = { message: \`Get ${rawName} \${id}\`, data: { id } };
}

function create(ctx) {
  const payload = ctx.request.body;
  ctx.status = 201;
  ctx.body = { message: 'Create ${rawName}', data: payload };
}

function update(ctx) {
  const { id } = ctx.params;
  const payload = ctx.request.body;
  ctx.body = { message: \`Update ${rawName} \${id}\`, data: { id, ...payload } };
}

function remove(ctx) {
  const { id } = ctx.params;
  ctx.body = { message: \`Delete ${rawName} \${id}\` };
}

module.exports = { getAll, getById, create, update, remove };`;
      }
    }
  }

  fs.writeFileSync(filePath, template.trim() + '\n');
  console.log(chalk.green(`  ✓ Generated controller: src/controllers/${rawName}controller.${ext}`));
}

function generateModelFile({ rawName, capName, ext, type, language, importSuffix }) {
  const database = detectDatabase();

  if (database === 'prisma') {
    console.log(chalk.cyan('\n  Using Prisma. Please append the following model to your prisma/schema.prisma:'));
    console.log(chalk.yellow(`
model ${capName} {
  id        Int      @id @default(autoincrement())
  createdAt DateTime @default(now())
}
`));
    console.log(chalk.cyan('  Then run:'));
    console.log(chalk.green('    npx prisma db push\n'));
    return;
  }

  const modelDir = path.join(process.cwd(), 'src/models');
  fs.mkdirSync(modelDir, { recursive: true });
  const filePath = path.join(modelDir, `${rawName}.${ext}`);

  if (fs.existsSync(filePath)) {
    console.error(chalk.yellow(`\n  ⚠ File already exists: src/models/${rawName}.${ext}`));
    process.exit(1);
  }

  let template = '';
  if (database === 'mongodb') {
    if (type === 'cjs') {
      template = `const mongoose = require('mongoose');
const { Schema } = mongoose;

const ${rawName}Schema = new Schema({
  name: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('${capName}', ${rawName}Schema);`;
    } else {
      template = `import mongoose, { Schema } from 'mongoose';

const ${rawName}Schema = new Schema({
  name: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('${capName}', ${rawName}Schema);`;
    }
  } else if (database === 'drizzle') {
    if (type === 'cjs') {
      template = `const { pgTable, serial, text, timestamp } = require('drizzle-orm/pg-core');

const ${rawName}s = pgTable('${rawName}s', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  createdAt: timestamp('created_at').defaultNow()
});

module.exports = { ${rawName}s };`;
    } else {
      template = `import { pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';

export const ${rawName}s = pgTable('${rawName}s', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  createdAt: timestamp('created_at').defaultNow()
});`;
    }
  } else {
    // sqlite/mysql/postgresql or none
    if (type === 'cjs') {
      template = `const db = require('../config/db');

// Add model queries or operations for ${capName} here

module.exports = {};`;
    } else {
      template = `import db from '../config/db${importSuffix}';

// Add model queries or operations for ${capName} here

export default {};`;
    }
  }

  fs.writeFileSync(filePath, template.trim() + '\n');
  console.log(chalk.green(`  ✓ Generated model: src/models/${rawName}.${ext}`));
}

function generateComponent(typeArg, nameArg) {
  // ── 1. Validate we are in a MVC project ──────────────────────────────────
  const configPath = path.join(process.cwd(), 'fogoe.config.json');
  if (!fs.existsSync(configPath)) {
    console.error(chalk.red('\n  ✗ fogoe.config.json not found.'));
    console.error(chalk.yellow('    Are you in a Fogoe project?\n'));
    process.exit(1);
  }

  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  const { language = 'js', arch = 'minimal', runtime = 'express', type = 'cjs' } = config.defaults || {};

  if (arch !== 'mvc') {
    console.error(chalk.red('\n  ✗ Code generation is only supported in MVC projects.'));
    console.error(chalk.yellow('    Your project architecture is set to "minimal".\n'));
    process.exit(1);
  }

  if (!typeArg || !nameArg) {
    console.error(chalk.red('\n  ✗ Missing type or name arguments.'));
    console.log(chalk.cyan('  Usage:'));
    console.log(`    ${chalk.green('fogoe generate route <name>')}`);
    console.log(`    ${chalk.green('fogoe generate controller <name>')}`);
    console.log(`    ${chalk.green('fogoe generate model <name>')}`);
    console.log(`    ${chalk.green('fogoe generate crud <name>')}\n`);
    process.exit(1);
  }

  const compType = typeArg.toLowerCase();
  const rawName = nameArg.toLowerCase();
  const capName = capitalize(rawName);
  const ext = language === 'ts' ? 'ts' : 'js';
  const importSuffix = type === 'esm' ? '.js' : '';

  if (!['route', 'controller', 'model', 'crud'].includes(compType)) {
    console.error(chalk.red(`\n  ✗ Invalid type: "${typeArg}". Expected "route", "controller", "model", or "crud".`));
    process.exit(1);
  }

  const ctx = { rawName, capName, ext, type, language, runtime, importSuffix };

  if (compType === 'route') {
    generateRouteFile({ ...ctx, isCrud: false });
  } else if (compType === 'controller') {
    generateControllerFile({ ...ctx, isCrud: false });
  } else if (compType === 'model') {
    generateModelFile(ctx);
  } else if (compType === 'crud') {
    console.log(chalk.cyan(`\nGenerating full CRUD vertical slice for "${rawName}"...\n`));
    generateModelFile(ctx);
    generateControllerFile({ ...ctx, isCrud: true });
    generateRouteFile({ ...ctx, isCrud: true });
    console.log(chalk.green(`\n  ✨ Successfully generated CRUD slice for ${rawName}!`));
  }
}

module.exports = { generateComponent, detectDatabase };
