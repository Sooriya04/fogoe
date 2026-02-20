# Fogoe

A minimal CLI for initializing Node.js backend projects with **TypeScript support** and zero friction.

## Problem

Backend developers repeatedly spend time on the same setup tasks:
- Initializing projects
- Installing base dependencies
- Configuring entry points
- Creating minimal server boilerplate

Even without business logic, reaching a basic "server is alive" state requires manual work. This repetitive setup creates unnecessary friction at the start of every project.

## Solution

Fogoe generates only the essentials — a server, a single route, and a working application lifecycle. Reach a running state in seconds, with full freedom to extend or restructure as needed.

🌐 Website: https://sooriya04.github.io/fogoe-site/

## Usage

Run Fogoe directly without installation:

```bash
npx fogoe          # Interactive initializer
npx fogoe --help   # Show available commands
```

Optionally, install globally:

```bash
npm install -g fogoe
fogoe              # Interactive initializer
fogoe init         # Initialize Git in existing project
fogoe push "msg"   # Push changes
```

Local installation is not required.

## What Fogoe Generates

Fogoe generates a working backend project with server setup and one route. The generated code is intentionally minimal and extensible, designed to reach a "server is running" state immediately. You control what happens next.

## Commands

Fogoe provides specific commands to manage your project lifecycle:

- **`fogoe`**: Launches the interactive setup wizard to scaffold a new project.
- **`fogoe init`**: Initializes a Git repository in an existing project and updates `fogoe.config.json` to enable Git features.
- **`fogoe push "<message>"`**: A shortcut to stage (`git add .`), commit (`git commit -m`), and push (`git push`) your changes to the remote repository.
- **`fogoe --help`**: Displays the usage guide and command list.

## Architecture Options

Fogoe supports two architecture patterns:

**Minimal**
- Single server entry point
- Fast startup
- No enforced structure
- Best for prototypes, microservices, or developers who prefer custom organization

**MVC**
- Controllers, routes, services, and config directories
- Still minimal, no business logic included
- Best for projects that anticipate growth or teams that prefer conventional structure

Choose based on project scope and team preferences.

## Supported Options

Fogoe supports the following options during initialization:

- **Languages:** JavaScript, TypeScript
- **Frameworks:** Express, Fastify
- **Module systems:** CommonJS, ES Modules
- **Git Integration:** Optional GitHub repository initialization

## Packages Included

| Category | Options |
|----------|---------|
| **Language** | JavaScript, TypeScript |
| **Framework** | Express, Fastify |
| **CORS** | cors, @fastify/cors |
| **Environment** | dotenv |
| **Database** | mongoose, prisma, mysql2, pg |
| **Hashing** | bcrypt, argon2 |
| **Auth** | jsonwebtoken (optional) |
| **Git** | GitHub initialization (optional) |

## Configuration Philosophy

Fogoe scaffolds projects, it does not configure full systems.

- Database, authentication, and encryption are opt-in dependencies
- Configuration is managed through environment variables (`.env`)
- No schemas, migrations, or business logic are generated
- Developers retain full control over implementation details

Fogoe provides the foundation. You build the system.

## TypeScript Support

Fogoe fully supports TypeScript with automatic configuration:

- **Automatic Type Installation:** All necessary `@types/*` packages are installed based on your selections
- **Smart tsconfig.json:** Generated with optimal settings for your module type and architecture
- **Path Aliases:** MVC projects get clean import paths (`@routes/*`, `@controllers/*`, etc.)
- **Zero Configuration:** TypeScript just works out of the box

### TypeScript Packages Automatically Installed:

- **Core:** `typescript`, `ts-node`, `tsx`, `@types/node`
- **Express:** `@types/express`, `@types/cors`
- **Fastify:** `@fastify/type-provider-typebox`
- **Databases:** `@types/pg`, `@types/mysql2` (when needed)
- **Libraries:** `@types/bcrypt`, `@types/jsonwebtoken` (when selected)

## Git Integration

Fogoe provides a state-driven Git flow to manage your repository:

- **Automatic .gitignore:** Configured with `node_modules/` and `.env`
- **Initial Commit:** All project files committed automatically
- **GitHub Push:** Connects to your repository and pushes the first commit
- **State Validation:** `fogoe push` validates the Git state from `fogoe.config.json` before executing.
- **Initialization Shortcut:** `fogoe init` handles both repository setup and configuration state updates.

### Git Setup Flow:

1. Select "yes" when prompted "Initialize Git repository?" during setup (or run `fogoe init` later).
2. Enter branch name (default: `main`)
3. Provide your GitHub repository URL
4. Fogoe handles the rest: init → add → commit → push
5. Use `fogoe push "your message"` for all subsequent updates.

## Non-goals

Fogoe intentionally does not:

- Generate business logic
- Enforce framework lock-in
- Create database schemas or migrations
- Make assumptions about production deployment
- Impose opinionated architecture beyond initialization

## Support

For bugs or feature requests, open an issue on [GitHub](https://github.com/Sooriya04/fogoe.git).

For general questions, contact: sooriya.work@gmail.com

## Contributing

Issues and pull requests are welcome. Keep changes minimal and aligned with Fogoe's philosophy of zero friction initialization.

## License

MIT License

Copyright (c) 2026 Sooriya B

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.