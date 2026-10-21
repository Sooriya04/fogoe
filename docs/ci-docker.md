# CI/CD, Docker & Cloud Deployments in Fogoe

Detailed guide to Fogoe's automated GitHub Actions workflows, multi-stage Alpine Dockerfiles, and zero-friction cloud deployment targets.

---

## 🚀 CI/CD & Docker Generation

Add automated deployment assets directly during scaffolding or on demand:

```bash
# During project creation
npx fogoe create my-api --framework fastify --lang ts --ci --docker --deploy fly -y

# Add to an existing Fogoe project
fogoe add ci
fogoe add docker
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

## 🐳 Multi-Stage Dockerfile Generation

Fogoe generates production-hardened, multi-stage Dockerfiles based on Alpine Linux:

- **Build Stage:** Installs dev dependencies, runs compilation (`tsc` or bundling), and purges build caches.
- **Production Stage:** Only includes production dependencies and compiled outputs.
- **Security Hardening:** Runs under an unprivileged non-root user (`USER node`).
- **Stack-Aware `.dockerignore`:** Excludes `node_modules`, `.env`, local database files, logs, and Git metadata.

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
