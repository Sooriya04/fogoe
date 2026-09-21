# Fogoe Features & Architecture Guide

This document provides an in-depth reference for all key features, supported runtimes, database drivers, and tooling provided by **Fogoe**.

---

## 1. Core Philosophy

* **Zero Friction:** Move from idea to a running, configured server in under 30 seconds.
* **No Hardcoded Lock-in:** Projects are composed dynamically from real on-disk template files with zero bloat.
* **Developer Control:** Fogoe sets up the plumbing (server, database connection, authentication middleware, error handling) without imposing unneeded abstractions or business logic.

---

## 2. Supported Runtimes

Fogoe supports four modern Node.js web frameworks:

### Express
* **Best For:** Battle-tested web APIs, broad ecosystem compatibility, and standard middleware chains.
* **Includes:** `express`, `cors`, `dotenv`, and `@types/express` (for TypeScript).

### Fastify
* **Best For:** Ultra-high throughput and low overhead APIs.
* **Features:** Built with native JSON serialization and schema-validated port handling.
* **Includes:** `fastify`, `@fastify/cors`, `dotenv`, and `@fastify/type-provider-typebox`.

### Hono
* **Best For:** Lightweight, modern TypeScript APIs and multi-runtime deployment.
* **Features:** Powered by `@hono/node-server` with built-in CORS middleware.
* **Includes:** `hono`, `@hono/node-server`, and `dotenv`.

### Koa
* **Best For:** Clean async/await middleware chains without callback overhead.
* **Features:** Router, body parser, and CORS pre-configured.
* **Includes:** `koa`, `@koa/router`, `@koa/cors`, `@koa/bodyparser`, and `dotenv`.

---

## 3. Language & Module System Support

### TypeScript
* **Smart `tsconfig.json`:** Generates optimal configurations targeting `ES2022` with strict mode enabled.
* **ESM & NodeNext:** Full native support for Node.js ES Modules using `"module": "NodeNext"` and `"moduleResolution": "NodeNext"`.
* **Path Aliases (MVC):** Preconfigured path aliases:
  * `@routes/*` → `./src/routes/*`
  * `@controllers/*` → `./src/controllers/*`
  * `@middlewares/*` → `./src/middlewares/*`
  * `@models/*` → `./src/models/*`
  * `@config/*` → `./src/config/*`
  * `@utils/*` → `./src/utils/*`
  * `@functions/*` → `./src/functions/*`
* **Scripts:** Includes `dev` (`tsx watch`), `build` (`tsc`), and `start` (`node dist/server.js`).

### JavaScript
* **Choice of Module System:** Supports both **CommonJS** (`require` / `module.exports`) and **ES Modules** (`import` / `export`).
* **Scripts:** Includes `dev` (`nodemon`) and `start` (`node`).

---

## 4. Architecture Patterns

### Minimal
```text
my-api/
├── src/
│   └── server.{js,ts}
├── .env
├── .gitignore
├── package.json
└── tsconfig.json (TS only)
```
* Single entry point with a health route (`GET /`).
* Ideal for microservices, quick prototypes, or custom directory structures.

### MVC (Model-View-Controller)
```text
my-api/
├── src/
│   ├── server.{js,ts}        # Server startup & port binding
│   ├── app.{js,ts}           # Application middleware & route mounting
│   ├── routes/               # API route definitions
│   │   └── home.{js,ts}
│   ├── controllers/          # Request handlers
│   │   └── homecontroller.{js,ts}
│   ├── models/               # Database schemas & queries
│   │   └── model.{js,ts}
│   ├── middlewares/          # Auth & custom middlewares
│   │   └── authMiddleware.{js,ts}
│   ├── config/               # Environment & database connections
│   │   ├── env.{js,ts}
│   │   └── db.{js,ts}
│   ├── utils/                # Hashing & helper utilities
│   │   └── hashing.{js,ts}
│   └── functions/            # Reusable business functions
│       └── helper.{js,ts}
```
* Structured convention designed for team scalability.

---

## 5. Database Providers

Fogoe sets up database connections and sample models out of the box:

| Provider | Driver / ORM | Default Configuration |
|---|---|---|
| **MongoDB** | `mongoose` | Mongoose client connecting via `DATABASE_URL` with connection event listeners. |
| **PostgreSQL** | `pg` | PostgreSQL connection pool (`new Pool()`) connected to `DATABASE_URL`. |
| **MySQL** | `mysql2/promise` | Promise-based MySQL connection pool (`mysql.createPool()`). |
| **SQLite** | `better-sqlite3` | High-performance embedded synchronous SQLite database. |
| **Prisma** | `@prisma/client` + `prisma` | Includes `prisma/schema.prisma` with User model and initialized `PrismaClient`. |
| **None** | — | Clean config placeholder for custom implementations. |

---

## 6. Authentication & Security

### Production JWT Middleware
When JWT authentication is selected, Fogoe creates a working `authMiddleware`:
* Extracts bearer token from `Authorization: Bearer <token>` header.
* Verifies token with `JWT_SECRET` from `.env`.
* Attaches the authenticated user payload to the request (`req.user` in Express/Fastify, `ctx.state.user` in Koa, `c.get('user')` in Hono).
* Returns `401 Unauthorized` for missing tokens and `403 Forbidden` for invalid tokens.

### Hashing Utilities
Provides password hashing helpers in `src/utils/hashing`:
* **Bcrypt:** `bcrypt` + `@types/bcrypt`
* **Argon2:** `argon2` (memory-hard password hashing)
* **Crypto:** Built-in Node.js `crypto` module (zero external dependencies)

### Always-On Security
* `.gitignore` is automatically configured to block `.env`, `node_modules/`, `dist/`, and debug logs—preventing accidental secret leaks even if git initialization is skipped.

---

## 7. Developer Tooling

### Testing (Vitest)
* Scaffolds `src/__tests__/app.test.{js,ts}` using Vitest.
* Adds `"test": "vitest"` script to `package.json`.

### Linting & Formatting (ESLint + Prettier)
* Pre-configured `.eslintrc.json` with recommended rules.
* TypeScript projects include `@typescript-eslint/parser` and `@typescript-eslint/eslint-plugin`.
* Prettier configured via `.prettierrc` (single quotes, 2 spaces, trailing commas).
* Adds `"lint": "eslint ."` and `"format": "prettier --write ."` scripts.

---

## 8. CLI Features

### Project Generators (`fogoe generate`)
Quickly scaffold new MVC components:
```bash
fogoe generate route user       # Generates src/routes/user.{js,ts}
fogoe generate controller user  # Generates src/controllers/usercontroller.{js,ts}
fogoe generate model user       # Generates src/models/user.{js,ts}
```

### Plugin System (`fogoe add`)
Easily integrate common backend capabilities into existing Fogoe projects:
* `redis`: Configures Redis client via `ioredis`.
* `zod`: Adds request body validation middleware using `zod`.
* `mailer`: Sets up SMTP email sending with `nodemailer`.
* `stripe`: Payment processing SDK configuration.
* `ratelimit`: Endpoint protection via `express-rate-limit`.
* `swagger`: Interactive OpenAPI docs via `swagger-ui-express`.
* `socket`: Real-time WebSocket support via `socket.io`.

### Project Lifecycle
* `fogoe status`: Displays current framework, language, database status, and Git state.
* `fogoe update`: Upgrades project dependencies using the active package manager (`npm`, `pnpm`, `bun`, `yarn`).
* `fogoe init`: Initializes Git, sets branch, adds remote, and updates `fogoe.config.json`.
* `fogoe push "<message>"`: Stages, commits, and pushes changes in one command.
