# Fogoe

A minimal CLI for initializing Node.js backend projects with zero friction.

## Problem

Backend developers repeatedly spend time on the same setup tasks:
- Initializing projects
- Installing base dependencies
- Configuring entry points
- Creating minimal server boilerplate

Even without business logic, reaching a basic "server is alive" state requires manual work. This repetitive setup creates unnecessary friction at the start of every project.

## Solution

Fogoe generates only the essentials — a server, a single route, and a working application lifecycle. Reach a running state in seconds, with full freedom to extend or restructure as needed.

## Usage

Run Fogoe directly without installation:

```bash
npx fogoe
```

Optionally, install globally:

```bash
npm install -g fogoe
fogoe
```

Local installation is not required.

## What Fogoe Generates

Fogoe generates a working backend project with server setup and one route. The generated code is intentionally minimal and extensible, designed to reach a "server is running" state immediately. You control what happens next.

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

## Supported Runtimes

Fogoe supports the following options during initialization:

- **Frameworks:** Express, Fastify
- **Module systems:** CommonJS, ES Modules

## Packages Included

| Category | Options |
|----------|---------|
| **Framework** | Express, Fastify |
| **CORS** | cors, @fastify/cors |
| **Environment** | dotenv |
| **Database** | mongoose, prisma, mysql2, pg |
| **Hashing** | bcrypt, argon2 |
| **Auth** | jsonwebtoken (optional) |

## Configuration Philosophy

Fogoe scaffolds projects, it does not configure full systems.

- Database, authentication, and encryption are opt-in dependencies
- Configuration is managed through environment variables (`.env`)
- No schemas, migrations, or business logic are generated
- Developers retain full control over implementation details

Fogoe provides the foundation. You build the system.

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