# Fogoe CLI Reference & Advanced Usage

Complete guide to all CLI commands, flags, AI prompt parsing, automated coding agent modes, and CRUD code generation.

---

## 🛠️ Complete CLI Flags

| Flag | Short | Allowed Values | Default | Description |
|---|---|---|---|---|
| `--ai` | — | Plain text string | — | Natural-language prompt to infer backend options |
| `--json` | — | boolean | `false` | Emits structured JSON to stdout for CI and autonomous agents |
| `--fix` | — | boolean | `false` | Automatically repairs fixable project doctor issues with confirmation |
| `--non-interactive` | — | boolean | `false` | Bypasses all interactive prompts |
| `--framework` | `-f` | `express`, `fastify`, `hono`, `koa` | `express` | Web application framework / runtime |
| `--lang` | `-l` | `ts`, `typescript`, `js`, `javascript` | `javascript` | Programming language |
| `--type` | `-t` | `esm`, `module`, `cjs`, `commonjs` | `commonjs` (`module` if TS) | Module type |
| `--arch` | `-a` | `minimal`, `mvc` | `minimal` | Project architectural layout |
| `--db` | `-d` | `drizzle`, `prisma`, `mongodb`, `postgres`, `mysql`, `sqlite`, `none` | `none` | Database driver or ORM |
| `--hashing` | — | `bcrypt`, `argon2`, `crypto` | `bcrypt` | Password hashing library |
| `--auth` | — | `jwt`, `none` | `none` | Authentication strategy |
| `--test` / `--no-test` | — | boolean | `false` | Vitest testing suite |
| `--lint` / `--no-lint` | — | boolean | `false` | ESLint + Prettier tooling |
| `--install` | `-i` | boolean | `false` | Auto-installs project dependencies |
| `--pm` | — | `npm`, `pnpm`, `bun`, `yarn` | `npm` | Explicit package manager enforcement |
| `--git` / `--no-git` | `-g` | boolean | `false` | Initializes local Git repository |
| `--commit` / `--no-commit` | — | string / boolean | `false` | Creates initial Git commit |
| `--github` | — | string / boolean | `false` | Connects or creates remote repository via `gh` CLI |
| `--private` / `--public` | — | boolean | `false` | Sets GitHub repository visibility |
| `--ci` / `--no-ci` | — | boolean | `false` | Generates stack-aware GitHub Actions workflow |
| `--docker` / `--no-docker` | — | boolean | `false` | Generates multi-stage Dockerfile and `.dockerignore` |
| `--deploy` | — | `dockerhub`, `fly`, `railway`, `render`, `none` | `none` | Cloud deployment trigger target |
| `--yes` | `-y` | boolean | `false` | Accepts default choices for unspecified flags |

---

## 🤖 AI-Assisted Scaffolding (`--ai`)

Describe what you want to build in plain English using the `--ai` flag. Fogoe's natural-language parser extracts the runtime, language, database, auth, testing, and deployment options:

```bash
fogoe create store-api --ai "High-performance Fastify backend with PostgreSQL using Drizzle ORM and JWT auth in TypeScript"
```

You can combine `--ai` with explicit flags to override specific decisions:

```bash
# Inferred by AI, but explicitly force Express runtime:
fogoe create store-api --ai "TypeScript API with Drizzle and JWT" --framework express
```

---

## 🤖 Coding Agent & CI Automation (`--json`)

Autonomous agents (Cursor, Copilot, Antigravity) and CI runners can initialize projects and read pure, machine-readable JSON without terminal ANSI noise:

```bash
fogoe create user-service --framework fastify --lang ts --db postgres --auth jwt --json
```

**JSON Output Format:**
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

Individual component generators:
```bash
fogoe g route user
fogoe g controller user
fogoe g model user
```

---

## 🔌 Modular Plugin Ecosystem

Install and configure backend features into an existing Fogoe project on demand:

```bash
fogoe add ci          # Stack-aware GitHub Actions pipeline (.github/workflows/ci.yml)
fogoe add docker      # Production multi-stage Dockerfile and .dockerignore
fogoe add redis       # ioredis client with environment configuration
fogoe add zod         # Zod schema validation middleware
fogoe add mailer      # Nodemailer SMTP transporter helper
fogoe add stripe      # Stripe SDK integration and webhook helpers
fogoe add ratelimit   # Express / HTTP rate-limiting middleware
fogoe add swagger     # OpenAPI swagger-ui-express documentation
fogoe add socket      # Socket.io real-time websocket server setup
```

---

## 🩺 Project Doctor (`fogoe doctor [--fix]`)

Inspect project configuration, dependency integrity, and security:

```bash
# Run diagnostics
fogoe doctor

# Auto-repair issues safely (with confirmation)
fogoe doctor --fix

# Headless repair in CI
fogoe doctor --fix -y --json
```

- **Guarantees:** Existing `.env` secrets are **never** overwritten, and user source code is never deleted.
