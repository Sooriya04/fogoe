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


## ISSUE 20 : Bump version to 1.0.7 and clean npm package.json for publishing
1. **Resolved NPM E403 Version Collision:** Bumped package version to `1.0.7` across `package.json`, `package-lock.json`, and website metadata because npm does not allow overwriting previously published versions (1.0.6).
2. **Fixed `bin` specification:** Standardized `"bin": { "fogoe": "bin/cli.js" }` (resolving npm's `"bin[fogoe]" script name was cleaned` warning).
3. **CI Node 22 Upgrade:** Updated the NPM publish step in `.github/workflows/ci.yml` to use Node.js `22.x` (Active LTS), eliminating runner deprecation notices.


