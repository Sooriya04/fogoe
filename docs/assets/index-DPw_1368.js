(function(){const r=document.createElement("link").relList;if(r&&r.supports&&r.supports("modulepreload"))return;for(const o of document.querySelectorAll('link[rel="modulepreload"]'))s(o);new MutationObserver(o=>{for(const n of o)if(n.type==="childList")for(const i of n.addedNodes)i.tagName==="LINK"&&i.rel==="modulepreload"&&s(i)}).observe(document,{childList:!0,subtree:!0});function t(o){const n={};return o.integrity&&(n.integrity=o.integrity),o.referrerPolicy&&(n.referrerPolicy=o.referrerPolicy),o.crossOrigin==="use-credentials"?n.credentials="include":o.crossOrigin==="anonymous"?n.credentials="omit":n.credentials="same-origin",n}function s(o){if(o.ep)return;o.ep=!0;const n=t(o);fetch(o.href,n)}})();const m={hono:{typescript:{esm:{minimal:`import { Hono } from 'hono';
import { serve } from '@hono/node-server';

const app = new Hono();

app.get('/', (c) => c.text('Hono minimal server is running!'));

serve({
  fetch: app.fetch,
  port: 3000
}, (info) => {
  console.log(\`Server is running on http://localhost:\${info.port}\`);
});`,mvc:`import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import homeRouter from './routes/home.ts';

const app = new Hono();

app.route('/', homeRouter);

serve({
  fetch: app.fetch,
  port: 3000
}, (info) => {
  console.log(\`Hono MVC server is running on http://localhost:\${info.port}\`);
});`},cjs:{minimal:`const { Hono } = require('hono');
const { serve } = require('@hono/node-server');

const app = new Hono();

app.get('/', (c) => c.text('Hono minimal server is running!'));

serve({
  fetch: app.fetch,
  port: 3000
}, (info) => {
  console.log(\`Server running on http://localhost:\${info.port}\`);
});`,mvc:`const { Hono } = require('hono');
const { serve } = require('@hono/node-server');
const homeRouter = require('./routes/home');

const app = new Hono();

app.route('/', homeRouter);

serve({
  fetch: app.fetch,
  port: 3000
}, (info) => {
  console.log(\`Server running on http://localhost:\${info.port}\`);
});`}},javascript:{esm:{minimal:`import { Hono } from 'hono';
import { serve } from '@hono/node-server';

const app = new Hono();

app.get('/', (c) => c.text('Hono minimal server is running!'));

serve({
  fetch: app.fetch,
  port: 3000
}, (info) => {
  console.log(\`Server is running on http://localhost:\${info.port}\`);
});`,mvc:`import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import homeRouter from './routes/home.js';

const app = new Hono();

app.route('/', homeRouter);

serve({
  fetch: app.fetch,
  port: 3000
}, (info) => {
  console.log(\`Hono MVC server running on http://localhost:\${info.port}\`);
});`},cjs:{minimal:`const { Hono } = require('hono');
const { serve } = require('@hono/node-server');

const app = new Hono();

app.get('/', (c) => c.text('Hono minimal server is running!'));

serve({
  fetch: app.fetch,
  port: 3000
}, (info) => {
  console.log(\`Server running on http://localhost:\${info.port}\`);
});`,mvc:`const { Hono } = require('hono');
const { serve } = require('@hono/node-server');
const homeRouter = require('./routes/home');

const app = new Hono();

app.route('/', homeRouter);

serve({
  fetch: app.fetch,
  port: 3000
}, (info) => {
  console.log(\`Server running on http://localhost:\${info.port}\`);
});`}}},express:{typescript:{esm:{minimal:`import express from 'express';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Express minimal server is running!');
});

app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});`,mvc:`import express from 'express';
import cors from 'cors';
import homeRouter from './routes/home.ts';

const app = express();
app.use(cors());
app.use(express.json());

app.use('/', homeRouter);

app.listen(3000, () => {
  console.log('Express MVC server running on http://localhost:3000');
});`},cjs:{minimal:`const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Express minimal server is running!');
});

app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});`,mvc:`const express = require('express');
const cors = require('cors');
const homeRouter = require('./routes/home');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/', homeRouter);

app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});`}},javascript:{esm:{minimal:`import express from 'express';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Express minimal server is running!');
});

app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});`,mvc:`import express from 'express';
import cors from 'cors';
import homeRouter from './routes/home.js';

const app = express();
app.use(cors());
app.use(express.json());

app.use('/', homeRouter);

app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});`},cjs:{minimal:`const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Express minimal server is running!');
});

app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});`,mvc:`const express = require('express');
const cors = require('cors');
const homeRouter = require('./routes/home');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/', homeRouter);

app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});`}}},fastify:{typescript:{esm:{minimal:`import Fastify from 'fastify';
import cors from '@fastify/cors';

const fastify = Fastify({ logger: true });
await fastify.register(cors);

fastify.get('/', async (request, reply) => {
  return 'Fastify minimal server is running!';
});

await fastify.listen({ port: 3000 });`,mvc:`import Fastify from 'fastify';
import cors from '@fastify/cors';
import homeRouter from './routes/home.ts';

const fastify = Fastify({ logger: true });
await fastify.register(cors);

await fastify.register(homeRouter);

await fastify.listen({ port: 3000 });`},cjs:{minimal:`const Fastify = require('fastify');
const cors = require('@fastify/cors');

const fastify = Fastify({ logger: true });

async function start() {
  await fastify.register(cors);
  fastify.get('/', async () => 'Fastify minimal server is running!');
  await fastify.listen({ port: 3000 });
}
start();`,mvc:`const Fastify = require('fastify');
const cors = require('@fastify/cors');
const homeRouter = require('./routes/home');

const fastify = Fastify({ logger: true });

async function start() {
  await fastify.register(cors);
  await fastify.register(homeRouter);
  await fastify.listen({ port: 3000 });
}
start();`}},javascript:{esm:{minimal:`import Fastify from 'fastify';
import cors from '@fastify/cors';

const fastify = Fastify({ logger: true });
await fastify.register(cors);

fastify.get('/', async (request, reply) => {
  return 'Fastify minimal server is running!';
});

await fastify.listen({ port: 3000 });`,mvc:`import Fastify from 'fastify';
import cors from '@fastify/cors';
import homeRouter from './routes/home.js';

const fastify = Fastify({ logger: true });
await fastify.register(cors);

await fastify.register(homeRouter);

await fastify.listen({ port: 3000 });`},cjs:{minimal:`const Fastify = require('fastify');
const cors = require('@fastify/cors');

const fastify = Fastify({ logger: true });

async function start() {
  await fastify.register(cors);
  fastify.get('/', async () => 'Fastify minimal server is running!');
  await fastify.listen({ port: 3000 });
}
start();`,mvc:`const Fastify = require('fastify');
const cors = require('@fastify/cors');
const homeRouter = require('./routes/home');

const fastify = Fastify({ logger: true });

async function start() {
  await fastify.register(cors);
  await fastify.register(homeRouter);
  await fastify.listen({ port: 3000 });
}
start();`}}},koa:{typescript:{esm:{minimal:`import Koa from 'koa';
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
});`,mvc:`import Koa from 'koa';
import cors from '@koa/cors';
import bodyParser from '@koa/bodyparser';
import homeRouter from './routes/home.ts';

const app = new Koa();

app.use(cors());
app.use(bodyParser());

app.use(homeRouter.routes()).use(homeRouter.allowedMethods());

app.listen(3000, () => {
  console.log('Koa MVC server running on http://localhost:3000');
});`},cjs:{minimal:`const Koa = require('koa');
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
});`,mvc:`const Koa = require('koa');
const cors = require('@koa/cors');
const bodyParser = require('@koa/bodyparser');
const homeRouter = require('./routes/home');

const app = new Koa();

app.use(cors());
app.use(bodyParser());

app.use(homeRouter.routes()).use(homeRouter.allowedMethods());

app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});`}},javascript:{esm:{minimal:`import Koa from 'koa';
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
});`,mvc:`import Koa from 'koa';
import cors from '@koa/cors';
import bodyParser from '@koa/bodyparser';
import homeRouter from './routes/home.js';

const app = new Koa();

app.use(cors());
app.use(bodyParser());

app.use(homeRouter.routes()).use(homeRouter.allowedMethods());

app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});`},cjs:{minimal:`const Koa = require('koa');
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
});`,mvc:`const Koa = require('koa');
const cors = require('@koa/cors');
const bodyParser = require('@koa/bodyparser');
const homeRouter = require('./routes/home');

const app = new Koa();

app.use(cors());
app.use(bodyParser());

app.use(homeRouter.routes()).use(homeRouter.allowedMethods());

app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});`}}}};window.copyCommand=function(e){navigator.clipboard.writeText(e).then(()=>{p(`Copied "${e}" to clipboard`)}).catch(r=>{console.error("Failed to copy",r)})};window.copyCodeContent=function(){const e=document.getElementById("code-output").innerText;navigator.clipboard.writeText(e).then(()=>{p("Code copied to clipboard")}).catch(r=>{console.error("Failed to copy code",r)})};function p(e){const r=document.getElementById("toast"),t=document.getElementById("toast-text");t.innerText=e,r.classList.add("show"),setTimeout(()=>{r.classList.remove("show")},2e3)}const a={language:"typescript",runtime:"hono",arch:"mvc",type:"esm",database:"prisma"};function u(e){const r=e.language==="typescript",t=r?"ts":"js",s=[{name:"your-project/",type:"folder",depth:0},{name:"node_modules/",type:"folder",depth:1},{name:"src/",type:"folder",depth:1},...e.database!=="none"?[{name:"config/",type:"folder",depth:2}]:[],...e.database==="prisma"?[{name:"db.ts",type:"file",depth:3}]:[],...e.database==="mongodb"?[{name:"db.ts",type:"file",depth:3}]:[],...e.database==="postgresql"?[{name:"db.ts",type:"file",depth:3}]:[],{name:"controllers/",type:"folder",depth:2},{name:`homecontroller.${t}`,type:"file",depth:3},{name:"middlewares/",type:"folder",depth:2},...e.database!=="none"?[{name:"models/",type:"folder",depth:2},{name:`model.${t}`,type:"file",depth:3}]:[],{name:"routes/",type:"folder",depth:2},{name:`home.${t}`,type:"file",depth:3},{name:"utils/",type:"folder",depth:2},{name:`hashing.${t}`,type:"file",depth:3},{name:`server.${t}`,type:"file",depth:2},...e.database==="prisma"?[{name:"prisma/",type:"folder",depth:1},{name:"schema.prisma",type:"file",depth:2}]:[],{name:".env",type:"file",depth:1},{name:".gitignore",type:"file",depth:1},{name:"fogoe.config.json",type:"file",depth:1},{name:"package.json",type:"file",depth:1},...r?[{name:"tsconfig.json",type:"file",depth:1}]:[]],o=[{name:"your-project/",type:"folder",depth:0},{name:"node_modules/",type:"folder",depth:1},{name:"src/",type:"folder",depth:1},{name:`server.${t}`,type:"file",depth:2},{name:".env",type:"file",depth:1},{name:".gitignore",type:"file",depth:1},{name:"fogoe.config.json",type:"file",depth:1},{name:"package.json",type:"file",depth:1},...r?[{name:"tsconfig.json",type:"file",depth:1}]:[]];return e.arch==="mvc"?s:o}function c(){const e=document.getElementById("tree-output");e.innerHTML="",u(a).forEach(s=>{const o=document.createElement("div");o.className=`tree-node depth-${s.depth} ${s.type}`;let n="📄";s.type==="folder"?n="📁":s.name===".env"?n="🔒":s.name.endsWith(".json")&&(n="⚙️"),o.innerHTML=`<i>${n}</i> <span>${s.name}</span>`,e.appendChild(o)});const t=a.language==="typescript"?"ts":"js";document.getElementById("file-title").innerText=`src/server.${t}`;try{const s=m[a.runtime][a.language][a.type][a.arch];document.getElementById("code-output").innerText=s}catch{document.getElementById("code-output").innerText="// Code template not found."}}document.querySelectorAll(".config-options").forEach(e=>{const r=e.getAttribute("data-group");e.querySelectorAll(".config-btn").forEach(t=>{t.addEventListener("click",()=>{e.querySelectorAll(".config-btn").forEach(s=>s.classList.remove("active")),t.classList.add("active"),a[r]=t.getAttribute("data-val"),c()})})});document.querySelectorAll(".display-tab").forEach(e=>{e.addEventListener("click",()=>{document.querySelectorAll(".display-tab").forEach(t=>t.classList.remove("active")),e.classList.add("active"),e.getAttribute("data-tab")==="tree"?(document.getElementById("pane-tree").classList.add("active"),document.getElementById("pane-code").classList.remove("active")):(document.getElementById("pane-code").classList.add("active"),document.getElementById("pane-tree").classList.remove("active"))})});c();
