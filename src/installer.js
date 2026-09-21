const { execSync } = require("child_process");

// Database package mapping
const dbPackages = {
  mongodb: "mongoose",
  prisma: "@prisma/client",
  mysql: "mysql2",
  postgresql: "pg",
  sqlite: "better-sqlite3",
  none: ""
};

// Hashing package mapping
const hashPackages = {
  bcrypt: "bcrypt",
  argon2: "argon2",
  crypto: ""
};

// TypeScript type packages for databases
const dbTypePackages = {
  mongodb: "", // mongoose includes types
  prisma: "", // prisma includes types
  mysql: "@types/mysql2",
  postgresql: "@types/pg",
  sqlite: "@types/better-sqlite3",
  none: ""
};

// TypeScript type packages for hashing
const hashTypePackages = {
  bcrypt: "@types/bcrypt",
  argon2: "", // argon2 includes types
  crypto: "" // built-in, no types needed
};

/**
 * Detect which package manager is being used or available.
 */
function getPackageManager() {
  const agent = process.env.npm_config_user_agent || "";
  if (agent.startsWith("bun")) return "bun";
  if (agent.startsWith("pnpm")) return "pnpm";
  if (agent.startsWith("yarn")) return "yarn";

  const fs = require("fs");
  if (fs.existsSync("bun.lockb") || fs.existsSync("bun.lock")) return "bun";
  if (fs.existsSync("pnpm-lock.yaml")) return "pnpm";
  if (fs.existsSync("yarn.lock")) return "yarn";

  try {
    execSync("bun --version", { stdio: "ignore" });
    return "bun";
  } catch {}
  try {
    execSync("pnpm --version", { stdio: "ignore" });
    return "pnpm";
  } catch {}
  try {
    execSync("yarn --version", { stdio: "ignore" });
    return "yarn";
  } catch {}

  return "npm";
}

/**
 * Install dependencies based on language, runtime, architecture, database, hashing, and JWT
 */
function install(language, runtime, architecture, database = "none", hashing = "bcrypt", useJwt = false, testing = false, linting = false) {
  // Base runtime packages
  let packages = `${runtime} cors dotenv`;
  let devPackages = "";

  // Nodemon is a development tool for JavaScript
  if (language === "javascript") {
    devPackages = "nodemon";
  }

  // Runtime-specific adjustments
  if (runtime === "fastify") {
    packages = `${runtime} @fastify/cors dotenv`;
  } else if (runtime === "hono") {
    packages = `hono @hono/node-server dotenv`;
  } else if (runtime === "koa") {
    packages = `koa @koa/router @koa/cors @koa/bodyparser dotenv`;
  }

  // MVC architecture packages
  if (architecture === "mvc") {
    // Hashing package
    if (hashPackages[hashing]) {
      packages += ` ${hashPackages[hashing]}`;
    }
    
    // JWT package
    if (useJwt) {
      packages += " jsonwebtoken";
    }
    
    // Database package
    if (database && database !== "none") {
      if (database === "prisma") {
        packages += " @prisma/client";
        devPackages += (devPackages ? " " : "") + "prisma";
      } else if (dbPackages[database]) {
        packages += ` ${dbPackages[database]}`;
      }
    }
  }

  // TypeScript specific packages (dev dependencies)
  if (language === "typescript") {
    devPackages += (devPackages ? " " : "") + "typescript ts-node tsx @types/node";

    if (runtime === "express") {
      devPackages += " @types/express @types/cors";
    } else if (runtime === "fastify") {
      devPackages += " @fastify/type-provider-typebox";
    } else if (runtime === "koa") {
      devPackages += " @types/koa @types/koa__router @types/koa__cors";
    }

    if (architecture === "mvc") {
      if (database && database !== "none" && dbTypePackages[database]) {
        devPackages += ` ${dbTypePackages[database]}`;
      }
      if (hashTypePackages[hashing]) {
        devPackages += ` ${hashTypePackages[hashing]}`;
      }
      if (useJwt) {
        devPackages += " @types/jsonwebtoken";
      }
    }
  }

  // Tooling packages
  if (testing) {
    devPackages += (devPackages ? " " : "") + "vitest";
  }

  if (linting) {
    devPackages += (devPackages ? " " : "") + "eslint prettier eslint-config-prettier";
    if (language === "typescript") {
      devPackages += " @typescript-eslint/parser @typescript-eslint/eslint-plugin";
    }
  }

  const pm = getPackageManager();
  console.log(`\nUsing package manager: ${pm}`);

  const trimPkgs = packages.trim();
  const trimDev = devPackages.trim();

  // Run separate commands for runtime dependencies and devDependencies
  if (pm === "npm") {
    if (trimPkgs) {
      execSync(`npm install --save ${trimPkgs}`, { stdio: "inherit" });
    }
    if (trimDev) {
      execSync(`npm install --save-dev ${trimDev}`, { stdio: "inherit" });
    }
  } else if (pm === "bun") {
    if (trimPkgs) {
      execSync(`bun add ${trimPkgs}`, { stdio: "inherit" });
    }
    if (trimDev) {
      execSync(`bun add -d ${trimDev}`, { stdio: "inherit" });
    }
  } else if (pm === "pnpm") {
    if (trimPkgs) {
      execSync(`pnpm add ${trimPkgs}`, { stdio: "inherit" });
    }
    if (trimDev) {
      execSync(`pnpm add -D ${trimDev}`, { stdio: "inherit" });
    }
  } else if (pm === "yarn") {
    if (trimPkgs) {
      execSync(`yarn add ${trimPkgs}`, { stdio: "inherit" });
    }
    if (trimDev) {
      execSync(`yarn add -D ${trimDev}`, { stdio: "inherit" });
    }
  }
}

module.exports = { install, getPackageManager };
