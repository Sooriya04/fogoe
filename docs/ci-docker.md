# CI/CD, Docker & Cloud Deployments in Fogoe

Detailed guide to Fogoe's automated GitHub Actions workflows, multi-distribution Dockerfiles, Docker Compose stacks, and zero-friction cloud deployment targets.

---

## 🚀 CI/CD & Docker Generation

Add automated deployment assets directly during scaffolding or on demand:

```bash
# During project creation with specific Docker OS and Compose:
npx fogoe create my-api --framework fastify --lang ts --docker --docker-os alpine --compose --db postgres -y

# Dedicated standalone commands in any project:
fogoe docker                   # Interactive Base OS selection prompt
fogoe docker --docker-os debian # Headless Debian Slim Dockerfile
fogoe compose                  # Generates stack-aware docker-compose.yml
fogoe ci --deploy fly          # Generates GitHub Actions workflow

# Or via plugin addition:
fogoe add docker
fogoe add compose
fogoe add ci
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

### Features:
- **Stack-Tailored `.gitignore`**: Automatically ignores SQLite databases (`*.db`, `*.sqlite`), Prisma artifacts, Drizzle caches, TypeScript build outputs (`dist/`, `*.tsbuildinfo`), test coverage, and environment secrets (`.env`).
- **Safe Fallback Git Identity**: Commits succeed deterministically even on clean CI machines or containers without pre-configured global Git usernames.
- **GitHub CLI Integration**: Creates public or private repositories and pushes the initial branch in one command.
- **Atomic Push**: `fogoe push "<message>"` stages, commits, and pushes changes to the upstream branch safely.

---

## 🐳 Multi-Distribution Dockerfile Generation

When executing `fogoe docker` or generating a project with `--docker`, developers can choose their preferred Linux container base distribution:

| OS Distribution | Node Base Image | Bun Base Image | Characteristics |
|---|---|---|---|
| **Alpine Linux** (`alpine`) *(Default)* | `node:20-alpine` | `oven/bun:1-alpine` | Ultra-lightweight (~50MB), `libc6-compat`, `wget` healthcheck. |
| **Debian Slim** (`debian`) | `node:20-slim` | `oven/bun:1-slim` | Standard glibc compatibility, minimal footprint, ideal for native C++ addons (`sharp`, `canvas`, `bcrypt`). |
| **Ubuntu** (`ubuntu`) | `node:20` | `oven/bun:1` | Full Linux environment with pre-installed build tools and wide compatibility. |
| **Google Distroless** (`distroless`) | `gcr.io/distroless/nodejs20-debian12` | `oven/bun:distroless` | Maximum security, zero shell, minimal attack surface running as non-root `USER nonroot`. |

### Docker Security & Optimization:
- **Multi-Stage Build Pipeline**: Build stage compiles TypeScript and prunes dev dependencies, production stage contains only minimal runtime artifacts.
- **Non-Root Principle**: Configured with unprivileged user permissions (`USER node` / `USER nonroot`).
- **Native Healthchecks**: Injected container `HEALTHCHECK` directive for orchestrators (Kubernetes, Docker Swarm, ECS).
- **Development Dockerfile (`Dockerfile.dev`)**: Fogoe also outputs a development Dockerfile with hot reloading (`npm run dev` / `bun run dev`) for containerized local workflows.
- **Stack-Aware `.dockerignore`**: Excludes `node_modules`, `.env`, local database files, logs, and Git metadata.

---

## 📦 Stack-Aware Docker Compose (`fogoe compose`)

Fogoe automatically inspects your project database and plugins to generate a complete `docker-compose.yml`:

```bash
fogoe compose
```

- **App Service**: Automatically maps your container port, sets `NODE_ENV=production`, configures depends-on services with health conditions, and connects to an isolated bridge network (`fogoe-network`).
- **Database Services**:
  - **PostgreSQL**: `postgres:16-alpine` with persistent volume and `pg_isready` healthcheck.
  - **MongoDB**: `mongo:7-jammy` with persistent volume and healthcheck.
  - **MySQL**: `mysql:8` with persistent volume and `mysqladmin ping` healthcheck.
- **Cache Services**:
  - **Redis**: `redis:7-alpine` with healthcheck whenever the `redis` plugin is enabled.
- **Persistent Named Volumes**: Guarantees zero data loss across container teardown and restarts.

---

## ☁️ Cloud Deployment Targets

Deploy targets configure GitHub Actions deployment jobs automatically:

| Target | Deployment Method | Required GitHub Secrets |
|---|---|---|
| `dockerhub` | Builds & pushes Docker container to Docker Hub | `DOCKERHUB_USERNAME`, `DOCKERHUB_TOKEN` |
| `fly` | Deploys using Flyctl to Fly.io | `FLY_API_TOKEN` |
| `railway` | Deploys using Railway CLI | `RAILWAY_TOKEN` |
| `render` | Triggers Render deploy webhook | `RENDER_DEPLOY_HOOK_URL` |
| `none` | Standard test, lint, and build pipeline only | None |
