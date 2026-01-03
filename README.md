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


## Packages Included

| Category | Options |
|----------|---------|
| **Framework** | Express, Fastify |
| **CORS** | cors, @fastify/cors |
| **Environment** | dotenv |
| **Database** | mongoose, prisma, mysql2, pg |
| **Hashing** | bcrypt, argon2 |
| **Auth** | jsonwebtoken (optional) |

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
