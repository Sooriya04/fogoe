<div align="center">

# Fogoe

### Zero-friction CLI for scaffolding modern Node.js backends.

[![npm version](https://img.shields.io/npm/v/fogoe.svg?style=flat-square&color=blue)](https://www.npmjs.com/package/fogoe)
[![npm downloads](https://img.shields.io/npm/dm/fogoe.svg?style=flat-square&color=emerald)](https://www.npmjs.com/package/fogoe)
[![License: Apache 2.0](https://img.shields.io/badge/License-Apache_2.0-blue.svg?style=flat-square)](LICENSE)
[![Node Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg?style=flat-square)](https://nodejs.org)
[![CI / CD](https://img.shields.io/github/actions/workflow/status/Sooriya04/fogoe/ci.yml?branch=main&style=flat-square&label=CI%2FCD)](https://github.com/Sooriya04/fogoe/actions)
[![Website](https://img.shields.io/badge/website-sooriya04.github.io%2Ffogoe-06b6d4.svg?style=flat-square)](https://sooriya04.github.io/fogoe/)

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

# AI-Assisted Scaffolding (Natural Language)
npx fogoe create blog-api --ai "High-performance Fastify backend with Drizzle ORM and JWT in TypeScript"

# Agent & CI Automation (Machine-readable JSON output)
npx fogoe create microservice --framework hono --lang js --arch minimal --json
```

---

## ✨ Features

- **🤖 AI-Assisted Scaffolding:** Describe your backend requirements in plain English (`--ai "..."`) and let Fogoe automatically configure runtime, database, auth, and tooling.
- **⚡ Agent & CI Ready (`--json`):** Pure machine-readable JSON output on stdout, eliminating terminal noise for autonomous coding agents (Antigravity, Cursor, Copilot) and CI workflows.
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
- **🐙 Automated Git & GitHub Setup:** Initialize local Git repositories, generate stack-tailored `.gitignore` files (with SQLite, Prisma, and compilation rules), create initial commits (`--commit`), and connect or create remote repositories on GitHub (`--github`, `--private`).
- **Built-in Git Lifecycle:** One-click repository initialization and atomic commits (`fogoe init`, `fogoe push`).

---

## 🚀 CLI Commands

| Command | Description |
|---|---|
| `fogoe [name]` | Interactive project initializer |
| `fogoe create <name> [flags]` | Scaffold project into a named directory |
| `fogoe create <name> --ai "<prompt>"` | AI-assisted scaffolding from natural-language description |
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
| `--ai` | — | Natural-language project description | — |
| `--json` | — | Output machine-readable JSON result | `false` |
| `--non-interactive` | — | Run without interactive prompts | `false` |
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
| `--pm` | — | `npm`, `pnpm`, `bun`, `yarn` (preferred package manager) | `npm` |
| `--git` / `--no-git` | `-g` | Initialize Git repository with stack-tailored `.gitignore` | `false` |
| `--commit` / `--no-commit` | — | Create initial project commit (`[message]` or boolean) | `false` |
| `--github` | — | Create via `gh` CLI or connect to remote URL (`[url]` / `[owner/repo]`) | `false` |
| `--private` / `--public` | — | Set GitHub repository visibility (default: public) | `false` |
| `--yes` | `-y` | Accept defaults for unspecified options | `false` |

---

## 🤖 AI-Assisted Scaffolding

Describe what you want to build in plain English using the `--ai` flag. Fogoe parses your requirements, infers the best runtime, language, database, auth strategy, and architecture, and scaffolds the project immediately:

```bash
fogoe create store-api --ai "High-performance Fastify backend with PostgreSQL using Drizzle ORM and JWT auth in TypeScript"
```

You can combine `--ai` with explicit flags whenever you want to override a specific option:

```bash
# Inferred by AI, but explicitly force Express runtime:
fogoe create store-api --ai "TypeScript API with Drizzle and JWT" --framework express
```

---

## 🤖 Coding Agent & CI Automation (`--json`)

Coding agents and CI pipelines can scaffold projects and ingest clean, structured JSON results without parsing ANSI terminal codes:

```bash
fogoe create user-service --framework fastify --lang ts --db postgres --auth jwt --json
```

**JSON Output Example:**
```json
{
  "success": true,
  "name": "user-service",
  "targetDir": "/workspace/user-service",
  "config": {
    "runtime": "fastify",
    "language": "ts",
    "type": "esm",
    "architecture": "mvc",
    "database": "postgresql",
    "hashing": "bcrypt",
    "useJwt": true,
    "testing": false,
    "linting": false,
    "git": false,
    "install": false
  },
  "files": [
    ".env",
    ".gitignore",
    "package.json",
    "src/app.ts",
    "src/server.ts",
    "tsconfig.json"
  ]
}
```

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

## 🐙 Automated Git & GitHub Setup

Fogoe provides complete zero-friction source control automation:

```bash
# 1. Local Git repository with stack-tailored .gitignore and initial commit
fogoe create my-api --framework fastify --lang ts --git --commit "feat: bootstrap my-api" -y

# 2. Automated GitHub repository creation via gh CLI
fogoe create blog-service --framework express --lang ts --git --github --private -y

# 3. Connect to an existing remote GitHub repository
fogoe create microservice --framework hono --lang ts --github https://github.com/my-org/microservice.git --commit
```

- **Stack-Tailored `.gitignore`**: Automatically configures ignore rules for SQLite databases (`*.db`, `*.sqlite`), Prisma, Drizzle artifacts, TypeScript compilation outputs (`dist/`, `*.tsbuildinfo`), coverage reports, and environment secrets.
- **Safe Fallback Git Identity**: Commits succeed deterministically even on clean CI machines or containers without pre-configured global Git usernames.
- **GitHub CLI Integration**: Creates public or private repositories and pushes the initial branch in one command.

---

## 🧪 Testing & CI/CD

Fogoe is rigorously tested across operating systems and Node versions:

- **OS Matrix**: Ubuntu (Linux), macOS, Windows
- **Node Matrix**: Node.js 18.x, 20.x, 22.x
- **Test Suite**: Native `node --test` runner with 36 passing unit & integration tests

Run tests locally:
```bash
npm test
```

---

## 📁 Repository Structure

```text
fogoe/
├── bin/              # CLI executable entry point (#!/usr/bin/env node)
├── src/              # Core CLI engine, AI parser, composer, CRUD generators, installer
├── templates/        # Clean on-disk project templates (Fastify, Express, Hono, Koa)
├── site/             # Interactive web configurator & docs showcase source (Vite)
├── test/             # Native node:test unit & integration test suites
└── .github/          # GitHub Actions CI matrix and Pages deployment workflows
```

> **Note on Website Deployment:** The documentation website in `site/` is built dynamically into `site/dist/` and deployed to [GitHub Pages](https://sooriya04.github.io/fogoe/) via `.github/workflows/pages.yml`. When publishing to the NPM registry, only `bin/`, `src/`, `templates/`, and root documentation are packaged—`site/` is excluded.

---

## 📄 License

Licensed under the [Apache License, Version 2.0](LICENSE).  
Copyright © 2026 [Sooriya B](https://github.com/Sooriya04).