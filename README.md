<div align="center">

# Fogoe

### Zero-friction CLI for scaffolding modern Node.js backends.

[![npm version](https://img.shields.io/npm/v/fogoe.svg?style=flat-square&color=blue)](https://www.npmjs.com/package/fogoe)
[![npm downloads](https://img.shields.io/npm/dm/fogoe.svg?style=flat-square&color=emerald)](https://www.npmjs.com/package/fogoe)
[![License: Apache 2.0](https://img.shields.io/badge/License-Apache_2.0-blue.svg?style=flat-square)](LICENSE)
[![Node Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg?style=flat-square)](https://nodejs.org)
[![CI / CD](https://img.shields.io/github/actions/workflow/status/Sooriya04/fogoe/ci.yml?branch=main&style=flat-square&label=CI%2FCD)](https://github.com/Sooriya04/fogoe/actions)

<p align="center">
  Scaffold production-grade backend projects in seconds across <b>Express</b>, <b>Fastify</b>, <b>Hono</b>, and <b>Koa</b>.<br/>
  Complete with TypeScript/JavaScript, ORMs (<b>Drizzle</b>, <b>Prisma</b>), authentication, and a full CRUD code generator.
</p>

</div>

---

## ⚡ Quick Start

### 1. Interactive Clack TUI
Run immediately via `npx` with zero global installation required:

```bash
# Initialize interactively in current directory
npx fogoe

# Or scaffold into a dedicated directory
npx fogoe create my-api
```

### 2. Automated Non-Interactive Mode (CLI Flags)
Scaffold fully automated projects with custom flags and skip prompts using `-y`:

```bash
# Fastify + TypeScript + Drizzle ORM + JWT Auth
npx fogoe create my-api --framework fastify --lang ts --db drizzle --auth jwt --install -y

# Express + TypeScript + PostgreSQL + Vitest + ESLint
npx fogoe create blog-api -f express -l ts -d postgres --test --lint -i -y

# Minimal single-file Hono server
npx fogoe create microservice -f hono -l js -a minimal -y
```

---

## ✨ Features

- **Interactive Clack TUI:** Fluid terminal wizard powered by `@clack/prompts` with animated spinners, hints, and error recovery.
- **Headless Non-Interactive CLI:** Complete flag set (`--framework`, `--lang`, `--db`, `--auth`, `--install`, `--yes`) for automated scripts, CI/CD, and dockerization.
- **4 Modern HTTP Runtimes:** Express, Fastify, Hono (`@hono/node-server`), and Koa.
- **TypeScript & JavaScript First:** Pure NodeNext ES Modules (`"type": "module"`) or classic CommonJS (`require`).
- **Disk-Based Template Architecture:** Real `.ts` and `.js` template files on disk, ensuring clean syntax and zero string escaping bugs.
- **6 Database & ORM Integrations:**
  - **Drizzle ORM** (with `drizzle-kit`, PostgreSQL driver, and migration scripts)
  - **Prisma** (with schema generator and client)
  - **MongoDB** (via `mongoose`)
  - **PostgreSQL** (via `pg` connection pooling)
  - **MySQL** (via `mysql2`)
  - **SQLite** (via `better-sqlite3`)
- **Vertical Slice CRUD Generator:** Generate a synchronized Model, Controller, and Route in a single command (`fogoe g crud <name>`).
- **Pluggable Architecture:** Add Redis, Zod, Stripe, Nodemailer, Rate Limiting, Swagger, and Socket.io to existing projects anytime (`fogoe add <plugin>`).
- **Built-in Git Lifecycle:** One-click GitHub repository initialization and atomic commits (`fogoe init`, `fogoe push`).

---

## 🚀 CLI Commands

| Command | Description |
|---|---|
| `fogoe [name]` | Interactive project initializer |
| `fogoe create <name> [flags]` | Scaffold project into a named directory |
| `fogoe generate <type> <name>` | Generate MVC components (`route`, `controller`, `model`, `crud`) |
| `fogoe g crud <name>` | Generate complete 3-layer vertical slice (Model + Controller + Routes) |
| `fogoe add [plugin]` | Add extensions: `redis`, `zod`, `mailer`, `stripe`, `ratelimit`, `swagger`, `socket` |
| `fogoe status` | Display project configuration and Git synchronization state |
| `fogoe update` | Upgrade all project dependencies to their latest compatible versions |
| `fogoe init` | Initialize Git repository and link with remote |
| `fogoe push "<message>"` | Stage, commit, and push changes to remote repository |
| `fogoe --help` | Display CLI usage guide |
| `fogoe --version` | Display installed Fogoe version |

---

## 🛠️ CLI Flags Reference

| Flag | Short | Allowed Values | Default |
|---|---|---|---|
| `--framework` | `-f` | `express`, `fastify`, `hono`, `koa` | `express` |
| `--lang` | `-l` | `ts`, `typescript`, `js`, `javascript` | `javascript` |
| `--type` | `-t` | `esm`, `module`, `cjs`, `commonjs` | `commonjs` (`module` if TS) |
| `--arch` | `-a` | `minimal`, `mvc` | `minimal` |
| `--db` | `-d` | `drizzle`, `prisma`, `mongodb`, `postgres`, `mysql`, `sqlite`, `none` | `none` |
| `--hashing` | — | `bcrypt`, `argon2`, `crypto` | `bcrypt` |
| `--auth` | — | `jwt`, `none` | `none` |
| `--test` / `--no-test` | — | Vitest testing suite | `false` |
| `--lint` / `--no-lint` | — | ESLint + Prettier configuration | `false` |
| `--install` | `-i` | Run package manager installation | `false` |
| `--git` | `-g` | Initialize Git repository | `false` |
| `--yes` | `-y` | Accept defaults for unspecified options | `false` |

---

## 🧩 Full CRUD Vertical Slice Generator

Fogoe includes an integrated vertical slice code generator for MVC projects. Running:

```bash
fogoe g crud product
```

Generates three synchronized components tailored to your selected runtime and database:

1. **Model** (`src/models/product.ts`):
   - Mongoose Schema (MongoDB)
   - Drizzle `pgTable` schema (Drizzle ORM)
   - Database query helper (PostgreSQL / MySQL / SQLite)
   - Prisma schema instructions (Prisma)
2. **Controller** (`src/controllers/productcontroller.ts`):
   - `getAll` (List records)
   - `getById` (Fetch record by ID)
   - `create` (Store new record)
   - `update` (Update existing record)
   - `remove` (Delete record)
3. **Route** (`src/routes/product.ts`):
   - `GET /` -> `getAll`
   - `GET /:id` -> `getById`
   - `POST /` -> `create`
   - `PUT /:id` -> `update`
   - `DELETE /:id` -> `remove`

You can also generate individual components:
```bash
fogoe g route user
fogoe g controller user
fogoe g model user
```

---

## 🔌 Modular Plugin Ecosystem

Install and configure backend features into an existing Fogoe project on demand:

```bash
fogoe add redis       # ioredis client with environment configuration
fogoe add zod         # Zod schema validation middleware
fogoe add mailer      # Nodemailer SMTP transporter helper
fogoe add stripe      # Stripe SDK integration and webhook helpers
fogoe add ratelimit   # Express / HTTP rate-limiting middleware
fogoe add swagger     # OpenAPI swagger-ui-express documentation
fogoe add socket      # Socket.io real-time websocket server setup
```

---

## 📁 Scaffolding Structures

### Minimal Architecture
```
my-api/
├── .env.example
├── .gitignore
├── README.md
├── package.json
└── src/
    └── server.ts (or server.js)
```

### MVC Architecture (with Drizzle & Auth)
```
my-api/
├── .env.example
├── .gitignore
├── README.md
├── package.json
├── drizzle.config.ts
├── fogoe.config.json
└── src/
    ├── app.ts
    ├── server.ts
    ├── config/
    │   └── db.ts
    ├── controllers/
    │   └── homecontroller.ts
    ├── middlewares/
    │   └── authMiddleware.ts
    ├── models/
    │   └── model.ts
    ├── routes/
    │   └── home.ts
    └── utils/
        └── hashing.ts
```

---

## 🧪 Testing & CI/CD

Fogoe is rigorously tested across operating systems and Node versions:

- **OS Matrix**: Ubuntu (Linux), macOS, Windows
- **Node Matrix**: Node.js 18.x, 20.x, 22.x
- **Test Suite**: Native `node --test` runner with 20 passing integration tests

Run tests locally:
```bash
npm test
```

---

## 📄 License

Licensed under the [Apache License, Version 2.0](LICENSE).  
Copyright © 2026 [Sooriya B](https://github.com/Sooriya04).