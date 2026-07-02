const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

function capitalize(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
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
    console.log(`    ${chalk.green('fogoe generate model <name>')}\n`);
    process.exit(1);
  }

  const compType = typeArg.toLowerCase();
  const rawName = nameArg.toLowerCase();
  const capName = capitalize(rawName);
  const ext = language === 'ts' ? 'ts' : 'js';
  const importSuffix = type === 'esm' ? `.${ext}` : '';

  if (!['route', 'controller', 'model'].includes(compType)) {
    console.error(chalk.red(`\n  ✗ Invalid type: "${typeArg}". Expected "route", "controller", or "model".`));
    process.exit(1);
  }

  if (compType === 'route') {
    const routeDir = path.join(process.cwd(), 'src/routes');
    fs.mkdirSync(routeDir, { recursive: true });
    const filePath = path.join(routeDir, `${rawName}.${ext}`);

    if (fs.existsSync(filePath)) {
      console.error(chalk.yellow(`\n  ⚠ File already exists: src/routes/${rawName}.${ext}`));
      process.exit(1);
    }

    let template = '';
    if (runtime === 'express') {
      if (type === 'cjs') {
        template = `const express = require('express');
const router = express.Router();
const controller = require('../controllers/${rawName}controller');

router.get('/', controller.index);

module.exports = router;`;
      } else {
        template = `import express from 'express';
const router = express.Router();
import { index } from '../controllers/${rawName}controller${importSuffix}';

router.get('/', index);

export default router;`;
      }
    } else if (runtime === 'fastify') {
      if (type === 'cjs') {
        template = `const controller = require('../controllers/${rawName}controller');

async function ${rawName}Routes(fastify, options) {
  fastify.get('/', controller.index);
}

module.exports = ${rawName}Routes;`;
      } else {
        template = `import { index } from '../controllers/${rawName}controller${importSuffix}';

export default async function ${rawName}Routes(fastify, options) {
  fastify.get('/', index);
}`;
      }
    } else if (runtime === 'hono') {
      if (type === 'cjs') {
        template = `const { Hono } = require('hono');
const controller = require('../controllers/${rawName}controller');

const router = new Hono();
router.get('/', controller.index);

module.exports = router;`;
      } else {
        template = `import { Hono } from 'hono';
import { index } from '../controllers/${rawName}controller${importSuffix}';

const router = new Hono();
router.get('/', index);

export default router;`;
      }
    } else if (runtime === 'koa') {
      if (type === 'cjs') {
        template = `const Router = require('@koa/router');
const controller = require('../controllers/${rawName}controller');

const router = new Router();
router.get('/', controller.index);

module.exports = router;`;
      } else {
        template = `import Router from '@koa/router';
import { index } from '../controllers/${rawName}controller${importSuffix}';

const router = new Router();
router.get('/', index);

export default router;`;
      }
    }

    fs.writeFileSync(filePath, template.trim() + '\n');
    console.log(chalk.green(`\n  ✓ Generated route: src/routes/${rawName}.${ext}`));
  }

  if (compType === 'controller') {
    const controllerDir = path.join(process.cwd(), 'src/controllers');
    fs.mkdirSync(controllerDir, { recursive: true });
    const filePath = path.join(controllerDir, `${rawName}controller.${ext}`);

    if (fs.existsSync(filePath)) {
      console.error(chalk.yellow(`\n  ⚠ File already exists: src/controllers/${rawName}controller.${ext}`));
      process.exit(1);
    }

    let template = '';
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

export async function index(req: FastifyRequest, reply: FastifyReply) {
  return '${capName} index';
}`;
      } else if (type === 'esm') {
        template = `export async function index(req, reply) {
  return '${capName} index';
}`;
      } else {
        template = `async function index(req, reply) {
  return '${capName} index';
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

    fs.writeFileSync(filePath, template.trim() + '\n');
    console.log(chalk.green(`\n  ✓ Generated controller: src/controllers/${rawName}controller.${ext}`));
  }

  if (compType === 'model') {
    // Check database from package.json or prisma schema
    let database = 'none';
    if (fs.existsSync(path.join(process.cwd(), 'prisma/schema.prisma'))) {
      database = 'prisma';
    } else {
      const dbConfigPathJs = path.join(process.cwd(), 'src/config/db.js');
      const dbConfigPathTs = path.join(process.cwd(), 'src/config/db.ts');
      const dbFile = fs.existsSync(dbConfigPathJs) ? dbConfigPathJs : (fs.existsSync(dbConfigPathTs) ? dbConfigPathTs : null);
      if (dbFile) {
        const content = fs.readFileSync(dbFile, 'utf8');
        if (content.includes('mongoose')) database = 'mongodb';
        else if (content.includes('mysql2')) database = 'mysql';
        else if (content.includes('pg')) database = 'postgresql';
      }
    }

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
        template = `import mongoose from 'mongoose';
const { Schema } = mongoose;

const ${rawName}Schema = new Schema({
  name: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('${capName}', ${rawName}Schema);`;
      }
    } else {
      // mysql/postgresql or none
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
    console.log(chalk.green(`\n  ✓ Generated model: src/models/${rawName}.${ext}`));
  }
}

module.exports = { generateComponent };
