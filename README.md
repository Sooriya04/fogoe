# Fogoe

> Zero-friction CLI for initializing Node.js backend projects with TypeScript and JavaScript.

[![npm version](https://img.shields.io/npm/v/fogoe.svg)](https://www.npmjs.com/package/fogoe)
[![License](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](LICENSE)

Reach a running, production-ready backend in seconds. Fogoe generates a clean foundation with a single route, database connection, and auth middleware—leaving you in complete control.

---

## Quick Start

Run instantly with `npx` (no installation required):

```bash
# Create a new project in a specific directory
npx fogoe create my-api

# Or initialize interactively in the current directory
npx fogoe
```

---

## Supported Options

| Category | Options |
|---|---|
| **Runtimes** | Express, Fastify, Hono, Koa |
| **Languages** | TypeScript, JavaScript |
| **Module Types** | CommonJS (`cjs`), ES Modules (`esm`) |
| **Architecture** | Minimal (Single-file server) or MVC (Full structure) |
| **Databases** | MongoDB (Mongoose), PostgreSQL (`pg`), MySQL (`mysql2`), SQLite (`better-sqlite3`), Prisma, None |
| **Hashing** | Bcrypt, Argon2, Node Crypto |
| **Auth** | JWT Authentication Middleware (Optional) |
| **Tooling** | Vitest (Testing), ESLint + Prettier (Linting/Formatting) |
| **Git** | Automated GitHub repository initialization & push flow |

---

## CLI Commands

```bash
fogoe create <name>          # Create a new project in a specific directory
fogoe [name]                 # Interactive setup wizard
fogoe generate <type> <name> # Generate MVC route, controller, or model (alias: fogoe g)
fogoe add [plugin]           # Add plugins (redis, zod, mailer, stripe, ratelimit, swagger, socket)
fogoe status                 # View current project configuration and Git status
fogoe update                 # Upgrade dependencies to latest versions
fogoe init                   # Initialize Git repository and link to remote
fogoe push "<message>"       # Stage, commit, and push changes to remote
fogoe --help                 # View help guide
fogoe --version              # View installed CLI version
```

---

## Documentation

For a detailed breakdown of all architectural options and capabilities, see the [Features Guide](docs/features.md).

---

## License

[Apache License 2.0](LICENSE) © 2026 Sooriya B