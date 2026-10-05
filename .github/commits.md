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

