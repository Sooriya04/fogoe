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


## Fix: pnpm Native Build Script Restrictions & Resilient Dependency Installation

1. **pnpm Native Build Script Resiliency (`ERR_PNPM_IGNORED_BUILDS`):**
   - Updated `src/installer.js` so that `pnpm add` automatically applies `--config.dangerouslyAllowAllBuilds=true` for both runtime dependencies and development packages.
   - Prevents fatal aborts when installing native C++ modules such as `better-sqlite3`, `bcrypt`, and `esbuild` under pnpm v10+ strict build policies.
   - Added automated multi-tier recovery: if native builds encounter restrictions, the installer logs a diagnostic notice and falls back to `npm install` without throwing an unhandled exception.

2. **Deterministic Scaffolding & Configuration Safety:**
   - Wrapped the `install(...)` invocation in `src/index.js` in a resilient `try...catch` boundary.
   - Guarantees that project configuration files (`fogoe.config.json`), local Git initialization, and remote repository linking are always finalized even if package installation experiences network interruptions or build warnings.

3. **Global CLI Environment Link:**
   - Linked `/home/sooriya/.local/bin/fogoe` directly to the active workspace binary and updated shell path configuration in `~/.bashrc` to ensure the Fogoe CLI executes deterministically across user terminal environments.


## Release v1.2.0 — Multi-Distribution Docker Base OS, Stack-Aware Compose & Documentation Sync

1. **Version Bump to v1.2.0:** Bumped package version in `package.json` and `package-lock.json` to trigger the automated npm release workflow upon push to `main`.
2. **Developer Documentation Site Update (`site/docs.html`):**
   - Added dedicated **Docker & Container Orchestration** documentation section with sidebar navigation links.
   - Documented `fogoe docker` with interactive Base OS selection (Alpine, Debian Slim, Ubuntu, Distroless), non-root unprivileged security, healthcheck probes, and hot-reloading `Dockerfile.dev`.
   - Documented `fogoe compose` with stack-aware database (PostgreSQL, MongoDB, MySQL) and Redis orchestration, persistent named volumes, and synchronized boot healthchecks.
   - Documented standard developer container runtime workflow (`docker compose up -d`, `docker compose ps`, `docker compose logs -f app`, `docker compose down`).
   - Updated CLI Commands and Flags reference tables with `--docker-os` and `--compose`.
   - Added container runtime architecture and pnpm native build script answers to Troubleshooting & FAQ.
   - Updated roadmap from Docker Compose to Kubernetes & Helm manifests (`fogoe add k8s`).
3. **Showcase Landing Page (`site/index.html`):**
   - Updated release hero banner and version badges to v1.2.0.
   - Added Multi-OS Docker & Compose featured spotlight card to the comprehensive guides section.
4. **README Synchronization:** Updated Primary Commands and Essential Flags reference tables.


## Feature: Universal NPM Package Support & Smart TypeScript Types in `fogoe add`

1. **Arbitrary NPM Package Installation:**
   - Enhanced `fogoe add <package>` in `src/plugins/index.js` to install any valid package from the npm registry (e.g. `fogoe add lodash`, `fogoe add axios`, `fogoe add dayjs`) in addition to pre-configured Fogoe plugins (`redis`, `stripe`, `swagger`, `ratelimit`, etc.).
   - Implemented `checkNpmPackageExists()` to query the npm registry before installation, providing helpful warnings and fallbacks when an unknown or misspelled package is requested.
2. **Automated TypeScript `@types` Resolution:**
   - Added `resolveTypesPackage()`: When installing an arbitrary npm package in a TypeScript project (`language: "ts"`), Fogoe automatically inspects the package on npm.
   - If the package bundles its own types (e.g. `axios`, `prisma`), redundant type packages are avoided.
   - If types are published separately (e.g. `lodash` -> `@types/lodash`), Fogoe automatically installs the corresponding `@types` package as a `devDependency`.
3. **Dev Dependency Flag Support (`-D` / `--dev`):**
   - Added `--dev` / `-D` / `--save-dev` flag parsing in `src/index.js`, allowing direct dev dependency installation (e.g., `fogoe add -D vitest`).
4. **Headless & Agent JSON Output (`--json`):**
   - Added silent headless installation with machine-readable JSON output (`--json`) and quiet package manager execution, returning `{ success: true, package, isDev, installedTypes }` directly for autonomous AI agents and CI scripts.
5. **Automated Unit & Integration Test Suite:**
   - Added `test/plugins.test.js` covering npm registry verification, bundled vs. external `@types` package resolution, and end-to-end headless JSON package installation, bringing the total passing test suite to 81 tests.


## Feature: Package & Plugin Uninstaller (`fogoe remove` / `fogoe rm`)

1. **Package Uninstaller Command:**
   - Implemented `removePlugin()` in `src/plugins/index.js` accessible via `fogoe remove <package>` or `fogoe rm <package>` in `src/index.js`.
   - Supports uninstalling both pre-configured Fogoe plugins (`redis`, `stripe`, `mailer`, etc.) and arbitrary packages installed from npm.
   - Stack-aware execution automatically detects and invokes the active package manager (`npm uninstall`, `pnpm remove`, `bun remove`, `yarn remove`).
2. **Automated Companion `@types` Cleanup:**
   - Automatically detects companion `@types/<package>` in `devDependencies` and uninstalls them in the same command, keeping TypeScript projects clean without orphaned types.
3. **Configuration & Addon Synchronization:**
   - Automatically removes the plugin from `fogoe.config.json`'s `addons` array if it was tracked.
4. **Interactive & Machine-Readable Output:**
   - Prompts with an interactive list of all installed packages and addons when invoked without arguments (`fogoe remove`).
   - Supports `--json` flag returning `{ success: true, package, removedPackages, configUpdated }` with silent output for agents and CI automation.
5. **Test Coverage:**
   - Expanded `test/plugins.test.js` to verify automated uninstallation, `@types` cleanup, and config sync, bringing the test suite to 82 passing tests.


## Fixes: Codebase Audit & Security Hardening (Ponytail Audit)

1. **Security & Shell Injection Prevention:**
   - Replaced raw shell string execution (`execSync("npm view ...")`) in `src/plugins/index.js` with `execFileSync` and discrete argument arrays (`['view', packageName, 'version']`), closing arbitrary shell injection vulnerabilities when untrusted package names are passed.
2. **Unified Package Installation & Uninstallation Logic:**
   - Extracted `installPackageList()` and `uninstallPackageList()` into `src/installer.js` and removed duplicated package manager installation code in `src/plugins/index.js`.
   - Now both initial scaffolding and `fogoe add` / `fogoe remove` share the exact same resilient pnpm build-script fallbacks and multi-package manager execution logic.
3. **Dependency Cleanup:**
   - Removed unused dependency `prompts` from `package.json` and `package-lock.json`, keeping only `@clack/prompts`.
4. **Validation Guard on NPM Lookups:**
   - Added `isValidNpmPackageName()` to validate syntax before querying the npm registry, preventing network delay and errors on malformed package names.


## Feature: Machine-Readable Agent Manifest Contract (`fogoe.agent.json` & `fogoe schema`)

1. **Modular Agent Architecture (`src/agent/index.js`):**
   - Created dedicated `src/agent/` module with `buildAgentManifest()`, `writeAgentManifest()`, and `getProjectManifest()`.
2. **Automatic Contract Generation (`fogoe.agent.json`):**
   - Automatically generated in every scaffolded project root alongside `fogoe.config.json` and `package.json`.
   - Outlines exact structural layout (`entryPoint`, `routes`, `controllers`, `models`, `middlewares`, `schema`), naming conventions, TypeScript path aliases, and rest endpoint conventions.
   - Supplies deterministic CLI recipes (`fogoe generate crud <name>`, `fogoe add <pkg>`, `fogoe remove <pkg>`, `fogoe doctor --json`).
3. **CLI Command (`fogoe schema` / `fogoe manifest`):**
   - Added `fogoe schema [--json]` command allowing AI coding agents to inspect the project contract dynamically without parsing arbitrary source code.
4. **Automated Test Suite:**
   - Added `test/agent.test.js` validating manifest schema structure, composer integration, and CLI headless output, bringing total passing test suite to 85 tests.


## Feature: Stack-Aware Framework Plugins (`ratelimit`, `swagger`, `zod`)

1. **Framework-Aware Dynamic Package Resolution:**
   - Refactored `PLUGINS` in `src/plugins/registry.js` to support stack overrides (`stacks`) and implemented `getPluginConfig(pluginName, runtime)`:
     - **`ratelimit`:**
       - Express: `express-rate-limit`
       - Fastify: `@fastify/rate-limit`
       - Hono: `hono-rate-limiter`
       - Koa: `koa-ratelimit` (+ companion `@types/koa-ratelimit`)
     - **`swagger`:**
       - Express: `swagger-ui-express swagger-jsdoc` (+ types)
       - Fastify: `@fastify/swagger @fastify/swagger-ui`
       - Hono: `@hono/zod-openapi @scalar/hono-api-reference`
       - Koa: `koa2-swagger-ui swagger-jsdoc` (+ types)
     - Preserves full backwards compatibility with static Express defaults.

2. **Framework-Native Code Generation Templates (`src/plugins/templates.js`):**
   - **Fastify:** Scaffolds plugin wrappers using Fastify's native `fastify.register()` hooks with `FastifyInstance` TypeScript typing.
   - **Hono:** Scaffolds rate limiter middleware using `app.use(limiter)` and OpenAPI documentation using `@scalar/hono-api-reference`'s interactive `apiReference` UI.
   - **Koa:** Scaffolds rate limiting with in-memory stores and `Context` types, and mounts Swagger UI via `koa2-swagger-ui`.
   - **Zod:** Upgraded schema validation middleware to adapt to runtime context (`FastifyRequest`/`FastifyReply` for Fastify, `c.req.json()` for Hono, `ctx.request.body` for Koa).

3. **Intelligent Stack Detection & Lifecycle Management (`src/plugins/index.js`):**
   - Added `detectRuntime()` to automatically resolve project framework from `fogoe.config.json` (`runtime` / `framework`) or `package.json` dependencies.
   - Updated `fogoe add` to scaffold framework-specific code and output stack-tailored next steps hints.
   - Updated `fogoe remove` to inspect all possible framework package variations across stacks and clean up whatever framework package is installed in `dependencies` / `devDependencies`.
   - Enhanced `--json` support for pre-configured plugins for CI and coding agents.

4. **CLI Help & Automated Test Suite:**
   - Updated `fogoe --help` to advertise stack-aware capabilities across all 4 HTTP runtimes.
   - Expanded `test/plugins.test.js` with unit and integration tests verifying package resolution, template syntax, runtime detection, and headless CLI scaffolding, bringing the passing test suite to 89 tests.


## Feature: Background Job Queue Plugin (`fogoe add queue` / `bullmq`)

1. **BullMQ Plugin Registration (`src/plugins/registry.js`):**
   - Registered `queue` and alias `bullmq` pointing to `bullmq` on npm with zero runtime devDependencies (bundled types).
   - Injected standard `REDIS_URL=redis://localhost:6379` into `.env` automatically upon addition.
2. **Production Queue & Worker Templates (`src/plugins/templates.js`):**
   - Implemented `src/queues/queue.[js|ts]` with configured `defaultQueue`, active `defaultWorker`, and generic helper function `addJob(name, data, opts)`.
   - Included mandatory `maxRetriesPerRequest: null` connection configuration required by BullMQ to prevent runtime connection assertion crashes.
   - Provided full type safety with `Job` types in TypeScript.
3. **Lifecycle & Guidance Integration:**
   - Added `queue` to CLI help output in `src/index.js` and stack guidance hints in `src/plugins/index.js`.
4. **Automated Test Suite Expansion:**
   - Extracted and added dedicated test files: `test/queue.test.js` (metadata, CJS/ESM/TS template rendering, and temporary directory scaffolding) and `test/stack-plugins.test.js` (per-framework package resolutions, native template generation across Express, Fastify, Hono, and Koa, and runtime detection).
   - Brought total passing automated test suite to 96 tests.


## Fixes: Code Generator Path Traversal & Template String Corruption

1. **Path Traversal Guard in `fogoe generate` ([`src/generate.js`](file:///media/workspace/fogoe/src/generate.js)):**
   - Added regex validation (`/^[a-z0-9_-]+$/`) on component names.
   - Prevents path traversal attempts (such as `../../malicious`) from escaping intended `src/routes`, `src/controllers`, or `src/models` directories.
2. **Safe Template Token Replacement ([`src/composer.js`](file:///media/workspace/fogoe/src/composer.js)):**
   - Switched template replacement from raw string substitution to a function callback `() => String(val)`.
   - Prevents `$$`, `$1`, `$&`, and other special JavaScript regex replacement patterns in secrets, database passwords, or descriptions from corrupting generated files.
3. **Automated Test Suite:**
   - Added security rejection tests in `test/generate.test.js` and dollar pattern preservation tests in `test/generator.test.js`, bringing the passing suite to 98 tests.


## Fixes: Safe Package Uninstallation & Doctor Prisma/Drizzle Database Audit

1. **Safe Package Uninstallation Failure Handling ([`src/installer.js`](file:///media/workspace/fogoe/src/installer.js)):**
   - Wrapped `uninstallPackageList` execution in a `try...catch` boundary with diagnostic warning fallback, matching `installPackageList`.
   - Prevents uncaught exceptions and CLI crashes if package managers report non-zero exit codes.
2. **Prisma & Drizzle `.env` Diagnostics in `fogoe doctor` ([`src/doctor/index.js`](file:///media/workspace/fogoe/src/doctor/index.js)):**
   - Added `prisma` and `drizzle` to required `DATABASE_URL` verification in `.env`.
   - Ensures projects configured with modern ORMs receive accurate diagnostics and automatic `.env` repair suggestions when database strings are missing.
3. **Automated Test Suite Expansion:**
   - Added tests in `test/doctor.test.js` and `test/plugins.test.js`, bringing passing test suite to 100 tests.




