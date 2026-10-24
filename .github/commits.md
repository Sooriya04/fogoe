## ISSUSE 15 : move git functionality into src/github modules

Refactored the GitHub/Git functionality by creating a new src/github/ folder and splitting the monolithic git.js into 4 modular files: auth.js (authentication checks), commands.js (individual git operations like init, add, commit, push), gitignore.js (.gitignore setup), and index.js (main orchestrator that exports everything). Updated the imports in src/index.js to point to the new ./github path and deleted the old git.js. The flow remains unchanged - initGit() works exactly the same way, but the code is now cleaner and more maintainable.


## ISSUE 16 : Implement extended Git flow and help command
Enhanced the Fogoe CLI with a robust, state-driven Git flow and a comprehensive help system. Added the fogoe push <message> command, which validates the project's Git state via fogoe.config.json before performing a combined stage, commit, and push operation. Implemented fogoe init to orchestrate repository initialization and automatically toggle the configuration state to "git": true. Additionally, introduced a --help / -h flag that displays usage guidelines and examples for both global and npx execution paths. Updated the README.md to thoroughly document the new command suite and configuration logic.


## ISSUE 17: Update Licensing and Git Documentation
Migrated the project's license to Apache License 2.0 to provide a robust open-source legal framework. This included updating the main `package.json`, replacing the MIT license text in `README.md` with the standard Apache 2.0 snippet, and adding the official `LICENSE` file to the root repository. Furthermore, established a dedicated `github.md` reference guide to clarify execution context, explicitly distinguishing the ephemeral nature of `npx fogoe` from a persistent global `npm install -g fogoe` setup, and detailing the custom zero-friction Git command suite (`init`, `push`).


## ISSUE 18 : Refactor to disk-based template architecture, fix core installer & TS bugs, and add CI/CD
Refactored Fogoe into a scalable, production-grade CLI generator modeled after industry standards (like create-vite). Key enhancements and bug fixes include:

1. **On-Disk Template Architecture:** Completely eliminated 33 legacy files containing thousands of lines of hardcoded string literals inside `src/templates/`. Generated projects are now composed from 202 real `.js` and `.ts` template files located on disk in the `templates/` directory, restoring full IDE syntax highlighting, linting, and formatting.
2. **Lightweight Composer Layer:** Implemented `src/composer.js` (`composeProject`) to dynamically compose projects from modular `base + runtime + database + hashing + auth + tooling` layers with zero-overhead token substitution (`{{PROJECT_NAME}}`, `{{PORT}}`, `{{DATABASE_URL}}`, etc.).
3. **Fixed NPM Save Flag Collision:** Fixed `src/installer.js` where combining `--save` and `--save-dev` in a single npm command forced all runtime dependencies into `devDependencies`. Separated runtime and development package installations into distinct, deterministic commands.
4. **Fixed TypeScript 5+ tsconfig.json:** Resolved `TS5090` non-relative path alias errors by prefixing paths with `./` (e.g., `"@routes/*": ["./routes/*"]`) and modernized module settings to `"NodeNext"` for ES module projects.
5. **Fixed Fastify Startup Crash:** Resolved schema validation error `FST_ERR_BAD_LISTEN_OPTION` by guaranteeing `port` is parsed as a number (`Number(PORT)`) across all Fastify templates.
6. **Fixed Code Generator Import Suffix:** Resolved TypeScript `TS5097` errors in `fogoe generate` by ensuring NodeNext ESM imports correctly reference `.js` extensions instead of illegal `.ts` extensions.
7. **Production JWT Auth Middleware:** Replaced empty `jwt` placeholder exports with a fully functional authentication middleware verifying the `Authorization: Bearer <token>` header across Express, Fastify, Hono, and Koa.
8. **Always-On Security:** Guaranteed that `.gitignore` (including `node_modules/`, `.env`, and `dist/`) is unconditionally created even when Git initialization is skipped, preventing accidental credential commits.
9. **Added SQLite Database Provider:** Added out-of-the-box support for SQLite (`better-sqlite3`) across all runtimes.
10. **Enhanced CLI Usability:** Added support for directory arguments (`fogoe create <name>` and `fogoe [name]`), escaped commit messages in `fogoe push`, and handled `Ctrl+C` cleanly without unhandled rejections.
11. **Comprehensive Cross-Platform CI/CD:** Added `.github/workflows/ci.yml` testing Linux, macOS, and Windows across Node.js 18, 20, and 22, along with an expanded test suite of 14 passing automated tests.


## ISSUE 19: Fix Cross-Platform Test Runner for CI/CD Matrix
Resolved GitHub Actions test matrix failures across Windows, macOS, and Linux:

1. **Portable Native Test Discovery:** Replaced the unexpanded glob pattern `"node --test test/**/*.test.js"` with `"node --test"` in `package.json`. On Windows (cmd/PowerShell) and non-globstar shells, globs were received as literal string paths (`Could not find test/**/*.test.js`), breaking the test job. Using `node --test` lets Node's native test runner discover test files automatically across all platforms and operating systems.
2. **Template File Isolation:** Renamed Vitest template files in `templates/tooling/vitest/` to `.tpl` extension (`app.test.js.tpl` / `app.test.ts.tpl`) so that Node's root test runner does not mistakenly attempt to execute scaffold template files as project test suites.
3. **Template Stripping in Composer:** Updated `src/composer.js` (`copyTemplateDir`) to automatically strip `.tpl` extensions upon file copy, preserving exact generated file names in scaffolded user projects.
4. **CI Matrix Green:** All 15 unit tests pass deterministically across Node 18, 20, and 22 on Ubuntu, macOS, and Windows.


## Release v1.0.8 — Clack TUI, CLI Flags, CRUD Generator, Drizzle ORM & Automated NPM CI

1. **NPM Publishing & Versioning:** Bumped the package to `1.0.7`, fixed the `bin` configuration, and upgraded the CI publish environment to Node.js 22.x.
2. **Decoupled NPM Publishing:** Restricted NPM publishing to `v*` release tags or manual workflow execution, preventing publishing on regular `main` branch pushes.
3. **Enhanced CLI & TUI:** Added Clack-based interactive prompts, spinners, banners, cancellation handling, and comprehensive non-interactive CLI flags for automated scaffolding.
4. **Full CRUD Generator:** Added `fogoe generate crud` with Model, Controller, and Route generation across Express, Fastify, Hono, and Koa for JavaScript and TypeScript.
5. **Drizzle ORM & Testing:** Added Drizzle ORM scaffolding and database scripts, while expanding automated coverage to 20 tests for CRUD generation, Drizzle integration, and CLI-based scaffolding.


## ISSUE 23 : Non-Interactive CLI Scaffolding, AI-Assisted Generation, and Agent Automation Support
1. **Non-Interactive Flag Execution:** Supported headless, zero-prompt project initialization via `fogoe create <name> --framework --lang --db --auth --git --install`, automatically removing dependency on interactive prompts when configuration flags are provided.
2. **AI-Assisted Natural Language Scaffolding:** Added `--ai "<prompt>"` parsing via `src/ai.js`, converting natural-language requirements (e.g. `"Fastify with Drizzle ORM and JWT in TypeScript"`) into structured generator configuration options.
3. **Coding Agent & CI Automation Support:** Introduced `--json` flag to emit clean, machine-readable JSON representations of scaffolded projects directly to `stdout`, suppressing terminal noise for seamless ingestion by autonomous coding agents and automated CI pipelines.
4. **Smart Version-Diff NPM CI Workflow:** Updated `.github/workflows/ci.yml` with automated version comparison against the NPM registry, allowing routine commits to `main` without publishing errors, while automatically publishing upon version increments.
5. **Expanded Test Suite:** Added unit and integration tests in `test/ai.test.js` and `test/generator.test.js`, bringing automated coverage to 26 passing tests across all execution paths.


## Release v1.0.10 — Package Manager Normalization, pnpm v11 Hardening, Website Overhaul, and Repository Cleanup

1. **Default to NPM & Fix Toolchain Hijacking:** Refactored `getPackageManager()` in `src/installer.js` to unconditionally default to `npm`. Eliminated the flawed binary check (`execSync("pnpm --version")`) that was hijacking user preference whenever `pnpm` happened to be installed globally. Added detection for `npm` from `npm_config_user_agent` and existing lockfiles.
2. **Explicit Package Manager CLI Flag (`--pm`):** Introduced `--pm <npm|pnpm|bun|yarn>` in `src/index.js`, allowing developers, CI runners, and scripts to explicitly enforce their preferred package manager.
3. **pnpm v10/v11 Build Script Resiliency:** Handled pnpm's strict `strictDepBuilds` policy (`ERR_PNPM_IGNORED_BUILDS` on `esbuild` in `tsx`/`vitest`). Added automated retry with `--config.dangerouslyAllowAllBuilds=true` and safe fallback to `npm` so dependency installation never terminates in an unhandled error.
4. **Accurate Database Diagnostics:** Fixed `src/status.js` to properly identify projects configured with Drizzle ORM (`Drizzle ORM (PostgreSQL)`) and SQLite (`better-sqlite3`), which were previously misidentified or missing.
5. **Deterministic Project Config:** Updated `src/composer.js` (`composeProject`) to automatically ensure `fogoe.config.json` is generated for all scaffolded projects, ensuring consistent metadata across both programmatic and interactive invocations.
6. **Repository Architecture & GitHub Pages Cleanup:** Eliminated redundant committed `docs/` and unused `others/` directories from git. Updated `site/vite.config.js` to output to standard `site/dist/` (gitignored), and configured `.github/workflows/pages.yml` to build and upload `./site/dist` directly, eliminating thousands of lines of compiled HTML diffs.
7. **Developer Showcase Website Overhaul:** Redesigned `site/index.html` with a high-density, developer-first aesthetic inspired by Biome, Fastify, and Vite. Added an interactive Stack Configurator with Drizzle ORM, dynamic copy-ready headless CLI command preview, clickable file tree source inspector, AI Scaffolding prompt runner, Agent JSON preview, and full CRUD architecture slice diagrams.
8. **Expanded Test Coverage:** Added unit tests for package manager fallback and explicit overrides in `test/scaffold.test.js`, bringing the automated test suite to 27 passing tests across all execution paths.


## Release v1.1.1 — Automated Git & GitHub Project Setup

1. **Automatic Git Initialization & Branch Standardization:** Added robust `git init` support defaulting to standard `main` branch across all platforms, ensuring repositories are clean and ready out of the box without requiring manual intervention.
2. **Stack-Aware .gitignore Generation:** Implemented dynamic `.gitignore` generation and merging in `src/github/gitignore.js` that automatically inspects project options and tailors rules for SQLite databases (`*.db`, `*.sqlite`, `*.db-journal`), Prisma artifacts (`prisma/*.db`), Drizzle cache, TypeScript build artifacts (`dist/`, `*.tsbuildinfo`), coverage reports, and environment secrets.
3. **Automated & Custom Initial Commits:** Added `--commit [message]` CLI option and safe fallback Git identity configuration (`ensureGitUserConfig`) so that initial commits succeed deterministically even on clean CI machines and containerized environments.
4. **GitHub CLI Repository Creation & Remote Linking:** Introduced `--github [url|owner/repo]` and `--private` / `--public` flags supporting automated repository creation via GitHub CLI (`gh repo create --source=. --remote=origin --push`) as well as direct remote linking and initial branch pushing.
5. **Interactive & Non-Interactive Automation:** Integrated Git and GitHub setup into both interactive Clack wizards and headless automation flows (`-y`, `--non-interactive`, `--json`).
6. **AI-Assisted Natural Language Parsing:** Enhanced `src/ai.js` to recognize repository requirements (e.g., `"with git and private github repo"`, `"with initial commit"`) from plain English prompts.
7. **Comprehensive Automated Test Coverage:** Added dedicated unit and integration tests in `test/github.test.js` and expanded `test/ai.test.js`, bringing automated test coverage to 36 passing tests across Linux, macOS, and Windows.


## Fixes — Execution Hardening, Edge Cases, and Non-Interactive Automation

1. **Deterministic & Safe Git Command Execution:** Converted all Git command invocations in `src/github/commands.js` and `src/index.js` (`fogoe push`) from raw shell string execution (`execSync`) to `execFileSync` with discrete argument arrays. This completely eliminates shell injection vectors and escaping errors when commit messages, branch names, or remotes contain quotes, backticks, dollar signs, or multiline strings.
2. **Resilient `fogoe push` Flow:** Updated `fogoe push` to check repository working status via `git status --porcelain` before creating commits, preventing command failures on already-clean working trees. Added automatic fallback to detect active branch name and set the upstream remote tracking branch (`git push -u origin <branch>`) when upstream is not yet configured.
3. **Graceful Branch Resolution on Fresh Repositories:** Fixed a fatal exit code 128 (`ambiguous argument 'HEAD'`) in `src/status.js` (`fogoe status`) when executed in newly initialized repositories prior to the initial commit by probing `git symbolic-ref --short HEAD` first with graceful fallbacks.
4. **Headless & Non-Interactive Automation in `fogoe init`:** Updated `src/github/index.js` and CLI arguments in `src/index.js` to pass options (`--github`, `--private`, `--commit`, `--yes`), allowing `fogoe init` and `fogoe git-init` to run headlessly in CI and automated scripting environments without blocking on interactive prompts.
5. **pnpm v10+ Build Script Resiliency in Plugin Manager:** Applied automated `--config.dangerouslyAllowAllBuilds=true` retries and fallback to npm in `src/plugins/index.js`, guaranteeing plugin package installations never fail on pnpm's strict build policies.
6. **Unified Configuration Schema:** Aligned `fogoe.config.json` generation in `src/index.js` to match `composer.js`, ensuring `hashing`, `auth`, and `addons: []` fields are consistently structured.
7. **Expanded Automated Test Suite:** Added unit tests verifying special-character commit message handling and non-interactive Git skips in `test/github.test.js`, bringing automated test suite coverage to 38 passing tests.
8. **TypeScript Code Generation Module Integrity:** Fixed `src/generate.js` where generating models in TypeScript projects configured with CommonJS emitted `require(...)` and `module.exports` syntax in `.ts` files. Ensured all TypeScript model templates cleanly emit type-safe ES module imports and exports.
9. **Full pnpm Build Script Retry in Installer:** Updated `src/installer.js` so both runtime and development dependencies are retried with `--config.dangerouslyAllowAllBuilds=true` when pnpm restricts build scripts, ensuring runtime dependencies are never missed on retries.
10. **Headless & Flag Support in `fogoe update`:** Updated `src/update.js` to accept CLI options (`-y`, `--yes`, `--pm`), bypassing interactive prompt blocks in non-interactive CI runs and respecting preferred package manager flags.
11. **Machine-Readable JSON in `fogoe status`:** Added structured JSON output to `src/status.js` when called with `--json`, enabling AI agents and CI environments to inspect project details without parsing ANSI chalk strings.
12. **Automated Test Coverage Expanded:** Added unit test coverage for TypeScript MVC model generation in `test/generate.test.js`, bringing total passing test suite coverage to 39 automated tests.
13. **PostgreSQL Database Alias Normalization:** Normalized `database: "postgres"` and `"pg"` to `"postgresql"` across `src/composer.js` and `src/installer.js`, preventing missing database template directories and uninstalled PostgreSQL driver packages when short alias names are supplied.


## Release v1.1.2 — Automated CI/CD Workflows, Multi-Stage Docker & Cloud Deployments

1. **Stack-Aware GitHub Actions Workflows:** Implemented `src/ci/githubActions.js` to dynamically generate production-grade `.github/workflows/ci.yml` pipelines tailored to project choices across all supported package managers (`npm`, `pnpm`, `bun`, `yarn`), testing frameworks (`vitest`), linters (`eslint`), and TypeScript builds.
2. **Multi-Stage Production Docker Support:** Created `src/ci/docker.js` generating lightweight, secure Alpine-based multi-stage `Dockerfile` and stack-aware `.dockerignore` for Node.js and Bun runtimes with non-root security execution.
3. **Automated Multi-Platform Deployment Targets:** Added `src/ci/deploy.js` with zero-friction deployment pipeline presets and secret management for Docker Hub, Fly.io, Railway, and Render.
4. **CLI Integration & Headless Automation:** Added `fogoe add ci`, `fogoe add docker`, `--ci`, `--docker`, and `--deploy <platform>` flags, fully integrated into both interactive setup wizards and headless agent/CI generation (`-y`, `--non-interactive`, `--json`).
5. **AI Prompt Requirements Parsing:** Enhanced `src/ai.js` natural-language parser to recognize Docker, GitHub Actions, and deployment target keywords from plain English prompts.
6. **Project Diagnostics Extension:** Enhanced `src/status.js` (`fogoe status`) to inspect and report live CI/CD and Docker containerization status in both terminal and machine-readable JSON outputs.
7. **Comprehensive Automated Test Suite:** Added dedicated unit and integration tests in `test/ci.test.js` validating workflow YAML generation, multi-stage Dockerfiles, deployment targets, and full orchestration across runtimes, bringing test coverage to 49 passing tests.
8. **Interactive Plugin & Subcommand Delegation:** Added `ci` and `docker` special plugin entries to `PLUGINS` registry in `src/plugins/registry.js` and wired clean delegation in `src/plugins/index.js`, allowing both interactive selection via `fogoe add` and direct CLI invocation via `fogoe add ci` / `fogoe add docker`. Decoupled deployment target prompting in `src/ci/index.js` to interactively prompt users when adding CI without blocking non-interactive workflows.
9. **Branch-Aware Root CI Matrix:** Updated root `.github/workflows/ci.yml` so automated CI pipelines run tests across both `main` and `dev` branches on every push and pull request while preserving restricted npm releases to `main`.
10. **Comprehensive Documentation & CLI Guide:** Documented all new workflows, Docker commands, flags (`--ci`, `--docker`, `--deploy`), and required secrets across `README.md`, `fogoe --help`, and the developer documentation site (`site/docs.html`).


## Release Enhancement: Project Doctor, Launch Trailer, Documentation Decoupling & Mobile Fixes

1. **Project Doctor & Safe Auto-Repair (`fogoe doctor [--fix]`):**
   - Implemented `src/doctor/index.js` performing full-stack repository diagnostics: configuration validity, package availability, npm lifecycle scripts (`dev`, `start`, `build`), `.env` variables, and `.gitignore` safety.
   - Enforced non-destructive repair logic: itemizes planned fixes with descriptions and prompts for explicit confirmation before touching files. Guarantees existing secrets in `.env` are strictly preserved and user source code is never deleted.
   - Automatically detects and resolves TypeScript non-relative path aliases (preventing `TS5090` compilation errors) and provides `--json` output for autonomous coding agents and automated CI runners.
   - Integrated `node bin/cli.js doctor --json` into the root `.github/workflows/ci.yml` test matrix and expanded automated coverage to 62 passing tests (`test/doctor.test.js`).

2. **Official Launch Trailer Integration:**
   - Rendered an 80-second, 1080p @ 30fps launch trailer using Remotion (`FogoeTrailer`) with synchronized 120 BPM soundtrack, modern UI cards, and zero AI-slop motion design.
   - Embedded the trailer into both `README.md` and the developer showcase website (`site/index.html`) using a fluid 16:9 responsive video player.
   - Verified 100% exclusion from the npm registry via `package.json` `"files"` whitelist, keeping the distributed package tarball under 60 KB.

3. **Documentation Modularization & NPM Package Slimming:**
   - Decoupled `README.md` from 370 lines down to ~150 lines, focusing on quick-start workflows, essential commands, and primary flags.
   - Migrated in-depth manuals and architecture specs into dedicated GitHub docs: `docs/cli.md`, `docs/architecture.md`, and `docs/ci-docker.md`.
   - Reduced published npm package size to 59.4 KB.

4. **Mobile Responsiveness & UI Polish:**
   - Fixed mobile layout regressions in the terminal install box on small viewports (enforced clean single-row flex alignment, compact tab sizing, and resolved misplaced copy button wrapping on screens under 480px).
   - Removed technical resolution badges and added graceful ellipsis text overflow for mobile navigation bars.


## Multi-Distribution Docker Base OS Selection, Stack-Aware Compose & CLI Subcommands

1. **Multi-Distribution Dockerfile Generation:**
   - Implemented interactive and headless Linux container base distribution selection across Alpine Linux (`node:20-alpine` / `oven/bun:1-alpine`), Debian Slim (`node:20-slim` / `oven/bun:1-slim`), Ubuntu (`node:20` / `oven/bun:1`), and Google Distroless (`gcr.io/distroless/nodejs20-debian12` / `oven/bun:distroless`).
   - Configured secure unprivileged non-root user execution (`USER fogoe` / `USER nonroot`).

2. **Built-in Container Healthchecks:**
   - Injected container `HEALTHCHECK` directives into production Dockerfiles (`wget` spider check on Alpine, native `node -e http.get` one-liner on Debian and Ubuntu) for orchestrator readiness verification.

3. **Development Dockerfile (`Dockerfile.dev`):**
   - Added dedicated development container generation configured for live hot reloading (`npm run dev` / `bun run dev`) alongside production Dockerfiles.

4. **Stack-Aware Docker Compose Generator (`fogoe compose`):**
   - Implemented `src/ci/compose.js` generating complete multi-container `docker-compose.yml` configurations with service orchestration, container port mapping, persistent named volumes, and bridge network `fogoe-network`:
     - PostgreSQL (`postgres:16-alpine` + `pg_isready` healthcheck)
     - MongoDB (`mongo:7-jammy` + ping healthcheck)
     - MySQL (`mysql:8` + `mysqladmin ping` healthcheck)
     - Redis cache service (`redis:7-alpine` + ping healthcheck) when `redis` addon or dependency is present

5. **Direct CLI Subcommands & Flags:**
   - Added standalone commands: `fogoe docker` (prompts for Base OS), `fogoe compose` (generates stack-aware `docker-compose.yml`), and `fogoe ci`.
   - Added CLI flags: `--docker-os <os>`, `--os <os>`, `--compose`, and `--no-compose`.
   - Added plugin delegation for `compose` and `docker-compose` via `fogoe add compose`.

6. **Documentation & Reference Updates:**
   - Updated `docs/ci-docker.md` and `docs/cli.md` covering all new container commands, distributions, compose services, and flags.

7. **Automated Test Suite Expansion:**
   - Added unit and integration tests in `test/ci.test.js` covering multi-OS Dockerfile generation, development Dockerfile, and Docker Compose generation for databases and Redis, bringing passing automated test suite to 68 tests.


## Hardening: Container Healthchecks, Service Name Sanitization & Runtime Distributions

1. **Service Name Sanitization:** Implemented `sanitizeServiceName()` to convert project names containing whitespace or special characters into valid Docker container and compose service identifiers.
2. **Synchronized Container Healthchecks:** Configured `depends_on` conditions with `condition: service_healthy` for PostgreSQL, MongoDB, MySQL, and Redis services to prevent application boot race conditions and connection refused errors.
3. **MongoDB Healthcheck Probe:** Injected native `mongosh` admin ping probe into MongoDB compose services.
4. **Development Container Package Manager Support:** Updated `Dockerfile.dev` generation to output `pnpm run dev`, `yarn run dev`, `bun run dev`, or `npm run dev` according to the active package manager.
5. **Bun on Ubuntu Base Image:** Configured Bun runtime generation on Ubuntu distributions to use official `oven/bun:1` image.
6. **Fallback Dependency & Port Detection:** Updated `setupCompose` to automatically discover database drivers and Redis packages from `package.json` dependencies and port overrides from `.env` when project config defaults are omitted.
7. **Automated Test Suite Expansion:** Added comprehensive unit and integration tests in `test/ci.test.js`, bringing the automated test suite to 77 passing tests.

