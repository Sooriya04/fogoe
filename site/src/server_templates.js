export const serverTemplates = {
  // Hono
  hono: {
    typescript: {
      esm: {
        minimal: `import { Hono } from 'hono';
import { serve } from '@hono/node-server';

const app = new Hono();

app.get('/', (c) => c.text('Hono minimal server is running!'));

serve({
  fetch: app.fetch,
  port: 3000
}, (info) => {
  console.log(\`Server is running on http://localhost:\${info.port}\`);
});`,
        mvc: `import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import homeRouter from './routes/home.ts';

const app = new Hono();

app.route('/', homeRouter);

serve({
  fetch: app.fetch,
  port: 3000
}, (info) => {
  console.log(\`Hono MVC server is running on http://localhost:\${info.port}\`);
});`
      },
      cjs: {
        minimal: `const { Hono } = require('hono');
const { serve } = require('@hono/node-server');

const app = new Hono();

app.get('/', (c) => c.text('Hono minimal server is running!'));

serve({
  fetch: app.fetch,
  port: 3000
}, (info) => {
  console.log(\`Server running on http://localhost:\${info.port}\`);
});`,
        mvc: `const { Hono } = require('hono');
const { serve } = require('@hono/node-server');
const homeRouter = require('./routes/home');

const app = new Hono();

app.route('/', homeRouter);

serve({
  fetch: app.fetch,
  port: 3000
}, (info) => {
  console.log(\`Server running on http://localhost:\${info.port}\`);
});`
      }
    },
    javascript: {
      esm: {
        minimal: `import { Hono } from 'hono';
import { serve } from '@hono/node-server';

const app = new Hono();

app.get('/', (c) => c.text('Hono minimal server is running!'));

serve({
  fetch: app.fetch,
  port: 3000
}, (info) => {
  console.log(\`Server is running on http://localhost:\${info.port}\`);
});`,
        mvc: `import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import homeRouter from './routes/home.js';

const app = new Hono();

app.route('/', homeRouter);

serve({
  fetch: app.fetch,
  port: 3000
}, (info) => {
  console.log(\`Hono MVC server running on http://localhost:\${info.port}\`);
});`
      },
      cjs: {
        minimal: `const { Hono } = require('hono');
const { serve } = require('@hono/node-server');

const app = new Hono();

app.get('/', (c) => c.text('Hono minimal server is running!'));

serve({
  fetch: app.fetch,
  port: 3000
}, (info) => {
  console.log(\`Server running on http://localhost:\${info.port}\`);
});`,
        mvc: `const { Hono } = require('hono');
const { serve } = require('@hono/node-server');
const homeRouter = require('./routes/home');

const app = new Hono();

app.route('/', homeRouter);

serve({
  fetch: app.fetch,
  port: 3000
}, (info) => {
  console.log(\`Server running on http://localhost:\${info.port}\`);
});`
      }
    }
  },

  // Express
  express: {
    typescript: {
      esm: {
        minimal: `import express from 'express';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Express minimal server is running!');
});

app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});`,
        mvc: `import express from 'express';
import cors from 'cors';
import homeRouter from './routes/home.ts';

const app = express();
app.use(cors());
app.use(express.json());

app.use('/', homeRouter);

app.listen(3000, () => {
  console.log('Express MVC server running on http://localhost:3000');
});`
      },
      cjs: {
        minimal: `const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Express minimal server is running!');
});

app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});`,
        mvc: `const express = require('express');
const cors = require('cors');
const homeRouter = require('./routes/home');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/', homeRouter);

app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});`
      }
    },
    javascript: {
      esm: {
        minimal: `import express from 'express';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Express minimal server is running!');
});

app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});`,
        mvc: `import express from 'express';
import cors from 'cors';
import homeRouter from './routes/home.js';

const app = express();
app.use(cors());
app.use(express.json());

app.use('/', homeRouter);

app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});`
      },
      cjs: {
        minimal: `const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Express minimal server is running!');
});

app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});`,
        mvc: `const express = require('express');
const cors = require('cors');
const homeRouter = require('./routes/home');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/', homeRouter);

app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});`
      }
    }
  },

  // Fastify
  fastify: {
    typescript: {
      esm: {
        minimal: `import Fastify from 'fastify';
import cors from '@fastify/cors';

const fastify = Fastify({ logger: true });
await fastify.register(cors);

fastify.get('/', async (request, reply) => {
  return 'Fastify minimal server is running!';
});

await fastify.listen({ port: 3000 });`,
        mvc: `import Fastify from 'fastify';
import cors from '@fastify/cors';
import homeRouter from './routes/home.ts';

const fastify = Fastify({ logger: true });
await fastify.register(cors);

await fastify.register(homeRouter);

await fastify.listen({ port: 3000 });`
      },
      cjs: {
        minimal: `const Fastify = require('fastify');
const cors = require('@fastify/cors');

const fastify = Fastify({ logger: true });

async function start() {
  await fastify.register(cors);
  fastify.get('/', async () => 'Fastify minimal server is running!');
  await fastify.listen({ port: 3000 });
}
start();`,
        mvc: `const Fastify = require('fastify');
const cors = require('@fastify/cors');
const homeRouter = require('./routes/home');

const fastify = Fastify({ logger: true });

async function start() {
  await fastify.register(cors);
  await fastify.register(homeRouter);
  await fastify.listen({ port: 3000 });
}
start();`
      }
    },
    javascript: {
      esm: {
        minimal: `import Fastify from 'fastify';
import cors from '@fastify/cors';

const fastify = Fastify({ logger: true });
await fastify.register(cors);

fastify.get('/', async (request, reply) => {
  return 'Fastify minimal server is running!';
});

await fastify.listen({ port: 3000 });`,
        mvc: `import Fastify from 'fastify';
import cors from '@fastify/cors';
import homeRouter from './routes/home.js';

const fastify = Fastify({ logger: true });
await fastify.register(cors);

await fastify.register(homeRouter);

await fastify.listen({ port: 3000 });`
      },
      cjs: {
        minimal: `const Fastify = require('fastify');
const cors = require('@fastify/cors');

const fastify = Fastify({ logger: true });

async function start() {
  await fastify.register(cors);
  fastify.get('/', async () => 'Fastify minimal server is running!');
  await fastify.listen({ port: 3000 });
}
start();`,
        mvc: `const Fastify = require('fastify');
const cors = require('@fastify/cors');
const homeRouter = require('./routes/home');

const fastify = Fastify({ logger: true });

async function start() {
  await fastify.register(cors);
  await fastify.register(homeRouter);
  await fastify.listen({ port: 3000 });
}
start();`
      }
    }
  },

  // Koa
  koa: {
    typescript: {
      esm: {
        minimal: `import Koa from 'koa';
import Router from '@koa/router';
import cors from '@koa/cors';
import bodyParser from '@koa/bodyparser';

const app = new Koa();
const router = new Router();

app.use(cors());
app.use(bodyParser());

router.get('/', (ctx) => {
  ctx.body = 'Koa minimal server is running!';
});

app.use(router.routes()).use(router.allowedMethods());

app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});`,
        mvc: `import Koa from 'koa';
import cors from '@koa/cors';
import bodyParser from '@koa/bodyparser';
import homeRouter from './routes/home.ts';

const app = new Koa();

app.use(cors());
app.use(bodyParser());

app.use(homeRouter.routes()).use(homeRouter.allowedMethods());

app.listen(3000, () => {
  console.log('Koa MVC server running on http://localhost:3000');
});`
      },
      cjs: {
        minimal: `const Koa = require('koa');
const Router = require('@koa/router');
const cors = require('@koa/cors');
const bodyParser = require('@koa/bodyparser');

const app = new Koa();
const router = new Router();

app.use(cors());
app.use(bodyParser());

router.get('/', (ctx) => {
  ctx.body = 'Koa minimal server is running!';
});

app.use(router.routes()).use(router.allowedMethods());

app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});`,
        mvc: `const Koa = require('koa');
const cors = require('@koa/cors');
const bodyParser = require('@koa/bodyparser');
const homeRouter = require('./routes/home');

const app = new Koa();

app.use(cors());
app.use(bodyParser());

app.use(homeRouter.routes()).use(homeRouter.allowedMethods());

app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});`
      }
    },
    javascript: {
      esm: {
        minimal: `import Koa from 'koa';
import Router from '@koa/router';
import cors from '@koa/cors';
import bodyParser from '@koa/bodyparser';

const app = new Koa();
const router = new Router();

app.use(cors());
app.use(bodyParser());

router.get('/', (ctx) => {
  ctx.body = 'Koa minimal server is running!';
});

app.use(router.routes()).use(router.allowedMethods());

app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});`,
        mvc: `import Koa from 'koa';
import cors from '@koa/cors';
import bodyParser from '@koa/bodyparser';
import homeRouter from './routes/home.js';

const app = new Koa();

app.use(cors());
app.use(bodyParser());

app.use(homeRouter.routes()).use(homeRouter.allowedMethods());

app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});`
      },
      cjs: {
        minimal: `const Koa = require('koa');
const Router = require('@koa/router');
const cors = require('@koa/cors');
const bodyParser = require('@koa/bodyparser');

const app = new Koa();
const router = new Router();

app.use(cors());
app.use(bodyParser());

router.get('/', (ctx) => {
  ctx.body = 'Koa minimal server is running!';
});

app.use(router.routes()).use(router.allowedMethods());

app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});`,
        mvc: `const Koa = require('koa');
const cors = require('@koa/cors');
const bodyParser = require('@koa/bodyparser');
const homeRouter = require('./routes/home');

const app = new Koa();

app.use(cors());
app.use(bodyParser());

app.use(homeRouter.routes()).use(homeRouter.allowedMethods());

app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});`
      }
    }
  }
};
