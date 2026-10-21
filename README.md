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

<p align="center">
  <video src="https://sooriya04.github.io/fogoe/fogoe-trailer.mp4" controls="controls" width="100%" style="max-width: 820px; border-radius: 8px;">
    Your browser does not support the video tag. Watch the trailer on <a href="https://sooriya04.github.io/fogoe/">the Fogoe website</a>.
  </video>
</p>

</div>

---

## ⚡ Quick Start

### 1. Interactive Terminal Wizard
Run immediately via `npx` with zero global installation required:

```bash
# Initialize interactively in current directory
npx fogoe

# Or scaffold into a dedicated directory
npx fogoe create my-api
```

### 2. Automated CLI Flags (Non-Interactive)
Scaffold production backends directly with flags and skip prompts using `-y`:

```bash
# Fastify + TypeScript + Drizzle ORM + JWT Auth
npx fogoe create my-api --framework fastify --lang ts --db drizzle --auth jwt --install -y

# AI-Assisted Scaffolding (Natural Language)
npx fogoe create blog-api --ai "High-performance Fastify backend with Drizzle ORM and JWT in TypeScript"

# Agent & CI Automation (Machine-readable JSON output)
npx fogoe create microservice --framework hono --lang js --arch minimal --json
```

---

## ✨ Features at a Glance

- **4 HTTP Runtimes:** Express, Fastify, Hono (`@hono/node-server`), and Koa.
- **TypeScript & JavaScript First:** Pure NodeNext ES Modules or CommonJS.
- **6 Databases & ORMs:** Drizzle ORM, Prisma, MongoDB (Mongoose), PostgreSQL, MySQL, and SQLite.
- **Disk-Based Template Architecture:** Pure `.ts` and `.js` template files on disk for deterministic file generation.
- **Vertical Slice CRUD Generator:** Generate Model, Controller, and Route in one command (`fogoe g crud <name>`).
- **Project Doctor:** Audit repository health, detect broken configurations, and auto-repair (`fogoe doctor [--fix]`).
- **AI-Assisted Scaffolding:** Scaffolds complete architectures from plain English requirements (`--ai "..."`).
- **Headless Agent Mode (`--json`):** Clean JSON output on `stdout` for autonomous agents (Cursor, Antigravity) and CI.
- **Automated CI/CD & Docker:** Pre-configured GitHub Actions pipelines and Alpine multi-stage Dockerfiles.
- **Automated Git Setup:** Initial commit, stack-tailored `.gitignore`, and GitHub repository linking via `gh` CLI.

---

## 🚀 Primary Commands

| Command | Description |
|---|---|
| `fogoe [name]` | Interactive project initializer |
| `fogoe create <name> [flags]` | Scaffold project into a named directory |
| `fogoe create <name> --ai "<prompt>"` | AI-assisted scaffolding from plain English description |
| `fogoe generate <type> <name>` | Generate MVC components (`route`, `controller`, `model`, `crud`) |
| `fogoe g crud <name>` | Generate complete 3-layer vertical slice (Model + Controller + Routes) |
| `fogoe doctor [--fix]` | Audit project health, configuration integrity, and safe auto-repair |
| `fogoe add [plugin]` | Add extensions: `ci`, `docker`, `redis`, `zod`, `mailer`, `stripe`, `ratelimit`, `swagger`, `socket` |
| `fogoe status` | Display project configuration, Git state, CI/CD, and Docker status |
| `fogoe update` | Upgrade all project dependencies to their latest compatible versions |
| `fogoe init` | Initialize Git repository and link with remote |
| `fogoe push "<message>"` | Stage, commit, and push changes to remote repository |

---

## 🛠️ Essential Flags

| Flag | Short | Allowed Values | Default | Description |
|---|---|---|---|---|
| `--framework` | `-f` | `express`, `fastify`, `hono`, `koa` | `express` | Web framework runtime |
| `--lang` | `-l` | `ts`, `js` | `js` | TypeScript or JavaScript |
| `--db` | `-d` | `drizzle`, `prisma`, `mongodb`, `postgres`, `mysql`, `sqlite`, `none` | `none` | Database driver / ORM |
| `--auth` | — | `jwt`, `none` | `none` | Authentication strategy |
| `--ai` | — | Plain text string | — | Natural-language prompt parsing |
| `--json` | — | boolean | `false` | Machine-readable JSON output |
| `--fix` | — | boolean | `false` | Safe auto-repair in `fogoe doctor` |
| `--ci` | — | boolean | `false` | Generate GitHub Actions pipeline |
| `--docker` | — | boolean | `false` | Generate production Dockerfile |
| `--deploy` | — | `dockerhub`, `fly`, `railway`, `render`, `none` | `none` | Deployment preset |
| `--install` | `-i` | boolean | `false` | Auto-install dependencies |
| `--pm` | — | `npm`, `pnpm`, `bun`, `yarn` | `npm` | Preferred package manager |
| `--yes` | `-y` | boolean | `false` | Accept default choices without prompting |

---

## 🩺 Project Doctor & Auto-Repair

Run comprehensive diagnostics on any Fogoe project to detect configuration issues, unprotected secrets, or missing dependencies:

```bash
# Run diagnostics
fogoe doctor

# Review and apply safe repairs with confirmation
fogoe doctor --fix

# Headless execution for CI & agents
fogoe doctor --fix -y --json
```

- **Safety Guarantee:** Fogoe Doctor will **never** overwrite existing secrets in `.env` and will never delete user files.

---

## 📚 Detailed Documentation

For in-depth guides, architectural diagrams, and configuration manuals:

- 📖 **[Interactive Docs Website](https://sooriya04.github.io/fogoe/docs.html)** — Comprehensive interactive documentation and stack configurator.
- ⚙️ **[CLI Reference & Advanced Flags](docs/cli.md)** — Complete CLI flag dictionary, AI parsing, agent JSON schemas, and CRUD generation.
- 🏗️ **[Scaffolding Architecture & Templates](docs/architecture.md)** — Minimal vs MVC directory structures, on-disk templates, and repository layout.
- 🚀 **[CI/CD, Docker & Deployments](docs/ci-docker.md)** — Multi-stage Alpine Dockerfiles, GitHub Actions matrix, cloud presets, and Git automation.

---

## 📄 License

Licensed under the [Apache License, Version 2.0](LICENSE).  
Copyright © 2026 [Sooriya B](https://github.com/Sooriya04).
