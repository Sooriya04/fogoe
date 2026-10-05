/**
 * AI-assisted natural language project requirements parser.
 * Converts natural-language descriptions into normalized Fogoe project options.
 */

function parseAiPrompt(promptText = '') {
  if (!promptText || typeof promptText !== 'string') {
    return null;
  }

  const text = promptText.toLowerCase().trim();
  const summary = [];

  // 1. Runtime / Framework detection
  let runtime = 'express';
  if (/\bfastify\b/.test(text)) {
    runtime = 'fastify';
    summary.push('Runtime: Fastify (high-performance)');
  } else if (/\bhono\b/.test(text)) {
    runtime = 'hono';
    summary.push('Runtime: Hono (ultrafast node-server)');
  } else if (/\bkoa\b/.test(text)) {
    runtime = 'koa';
    summary.push('Runtime: Koa');
  } else if (/\bexpress\b/.test(text)) {
    runtime = 'express';
    summary.push('Runtime: Express');
  } else {
    runtime = 'express';
    summary.push('Runtime: Express (default)');
  }

  // 2. Language detection
  let language = 'javascript';
  const wantsTs = /\b(typescript|ts|type-safe|types)\b/.test(text);
  const wantsJs = /\b(javascript|js|vanilla)\b/.test(text);

  if (wantsTs) {
    language = 'typescript';
    summary.push('Language: TypeScript');
  } else if (wantsJs) {
    language = 'javascript';
    summary.push('Language: JavaScript');
  } else if (/\bdrizzle\b/.test(text)) {
    // Drizzle defaults to TypeScript in modern ecosystems
    language = 'typescript';
    summary.push('Language: TypeScript (inferred from Drizzle ORM)');
  } else {
    language = 'javascript';
    summary.push('Language: JavaScript (default)');
  }

  // 3. Database & ORM detection
  let database = 'none';
  if (/\b(no db|no database|without db|no-db)\b/.test(text)) {
    database = 'none';
    summary.push('Database: None');
  } else if (/\bdrizzle\b/.test(text)) {
    database = 'drizzle';
    summary.push('Database: Drizzle ORM (PostgreSQL)');
  } else if (/\bprisma\b/.test(text)) {
    database = 'prisma';
    summary.push('Database: Prisma ORM');
  } else if (/\b(mongo|mongodb|mongoose)\b/.test(text)) {
    database = 'mongodb';
    summary.push('Database: MongoDB (Mongoose)');
  } else if (/\b(postgres|postgresql|pg)\b/.test(text)) {
    database = 'postgresql';
    summary.push('Database: PostgreSQL (pg driver)');
  } else if (/\b(mysql|mysql2|mariadb)\b/.test(text)) {
    database = 'mysql';
    summary.push('Database: MySQL (mysql2)');
  } else if (/\b(sqlite|better-sqlite3)\b/.test(text)) {
    database = 'sqlite';
    summary.push('Database: SQLite (better-sqlite3)');
  }

  // 4. Authentication (JWT)
  let useJwt = false;
  if (!/\b(no auth|without auth|no-auth)\b/.test(text) && /\b(jwt|jsonwebtoken|auth|authentication|token|bearer|login|protected)\b/.test(text)) {
    useJwt = true;
    summary.push('Auth: JSON Web Token (JWT) Middleware');
  }

  // 5. Hashing Library
  let hashing = 'bcrypt';
  if (/\bargon2?\b/.test(text)) {
    hashing = 'argon2';
    summary.push('Hashing: Argon2');
  } else if (/\bcrypto\b/.test(text)) {
    hashing = 'crypto';
    summary.push('Hashing: Node.js Built-in Crypto');
  } else if (database !== 'none' || useJwt) {
    hashing = 'bcrypt';
    summary.push('Hashing: Bcrypt');
  }

  // 6. Architecture (Minimal vs MVC)
  let architecture = 'minimal';
  const explicitlyMinimal = /\b(minimal|single-file|microservice|simple server|lightweight)\b/.test(text);
  const wantsMvc = /\b(mvc|controllers?|models?|routes?|crud|full api|api)\b/.test(text);

  if (explicitlyMinimal) {
    architecture = 'minimal';
    summary.push('Architecture: Minimal (single-file)');
  } else if (wantsMvc || database !== 'none' || useJwt) {
    architecture = 'mvc';
    summary.push('Architecture: MVC (Models, Controllers, Routes)');
  } else {
    architecture = 'minimal';
    summary.push('Architecture: Minimal');
  }

  // 7. Module Type
  let type = language === 'typescript' ? 'module' : 'commonjs';
  if (/\b(esm|es module|esmodules|modules?)\b/.test(text)) {
    type = 'module';
  } else if (/\b(cjs|commonjs|require)\b/.test(text)) {
    type = 'commonjs';
  }

  // 8. Tooling (Vitest & ESLint)
  let testing = false;
  if (/\b(test|testing|vitest|unit tests?|tests?)\b/.test(text)) {
    testing = true;
    summary.push('Testing: Vitest test suite');
  }

  let linting = false;
  if (/\b(lint|linting|eslint|prettier|formatting|code style)\b/.test(text)) {
    linting = true;
    summary.push('Linting: ESLint + Prettier');
  }

  // 9. Git & Install
  let install = false;
  if (/\b(install|install dependencies|npm install|dependencies)\b/.test(text)) {
    install = true;
    summary.push('Dependencies: Auto-install packages');
  }

  let git = false;
  let github = false;
  let isPrivate = false;
  let commit = false;

  if (/\b(github|gh repo|push to github|remote repo|connect github)\b/.test(text)) {
    git = true;
    github = true;
    commit = true;
    if (/\b(private|private repo|private repository)\b/.test(text)) {
      isPrivate = true;
      summary.push('GitHub: Create private repository & push initial commit');
    } else {
      summary.push('GitHub: Create repository & push initial commit');
    }
  } else if (/\b(git|git init|version control|vcs|local repo|local git)\b/.test(text)) {
    git = true;
    summary.push('Git: Initialize repository');
  }

  if (/\b(commit|initial commit|first commit)\b/.test(text)) {
    git = true;
    commit = true;
    if (!github) {
      summary.push('Git: Create initial project commit');
    }
  }

  return {
    rawPrompt: promptText,
    runtime,
    language,
    type,
    architecture,
    database,
    hashing,
    useJwt,
    testing,
    linting,
    install,
    git,
    github,
    isPrivate,
    commit,
    summary,
  };
}

module.exports = { parseAiPrompt };
