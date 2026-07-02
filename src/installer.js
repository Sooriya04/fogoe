const { execSync } = require("child_process");

// Database package mapping
const dbPackages = {
  mongodb: "mongoose",
  prisma: "prisma @prisma/client",
  mysql: "mysql2",
  postgresql: "pg",
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

  const { execSync } = require("child_process");
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
  // Base packages: runtime + nodemon + cors + dotenv
  let packages = `${runtime} nodemon cors dotenv`;

  // For Fastify, use @fastify/cors instead of cors
  if (runtime === "fastify") {
    packages = `${runtime} nodemon @fastify/cors dotenv`;
  } else if (runtime === "hono") {
    packages = `hono @hono/node-server nodemon dotenv`;
  } else if (runtime === "koa") {
    packages = `koa @koa/router @koa/cors @koa/bodyparser nodemon dotenv`;
  }

  // MVC architecture needs additional packages
  if (architecture === "mvc") {
    // Add hashing package
    if (hashPackages[hashing]) {
      packages += ` ${hashPackages[hashing]}`;
    }
    
    // Add JWT if selected
    if (useJwt) {
      packages += " jsonwebtoken";
    }
    
    // Add database package if selected
    if (database && database !== "none") {
      packages += ` ${dbPackages[database]}`;
    }
  }

  // TypeScript specific packages (as dev dependencies)
  let devPackages = "";
  if (language === "typescript") {
    // Base TypeScript packages (dev dependencies)
    devPackages = "typescript ts-node tsx @types/node";

    // Framework type packages
    if (runtime === "express") {
      devPackages += " @types/express @types/cors";
    }
    // Fastify has built-in TypeScript support, but we can add type provider
    if (runtime === "fastify") {
      devPackages += " @fastify/type-provider-typebox";
    }
    if (runtime === "koa") {
      devPackages += " @types/koa @types/koa__router @types/koa__cors";
    }

    // MVC architecture type packages
    if (architecture === "mvc") {
      // Database types
      if (database && database !== "none" && dbTypePackages[database]) {
        devPackages += ` ${dbTypePackages[database]}`;
      }

      // Hashing types
      if (hashTypePackages[hashing]) {
        devPackages += ` ${hashTypePackages[hashing]}`;
      }

      // JWT types
      if (useJwt) {
        devPackages += " @types/jsonwebtoken";
      }
    }
  }

  // Tooling packages
  if (testing) {
    devPackages += " vitest";
  }

  if (linting) {
    devPackages += " eslint prettier eslint-config-prettier";
    if (language === "typescript") {
      devPackages += " @typescript-eslint/parser @typescript-eslint/eslint-plugin";
    }
  }

  const pm = getPackageManager();
  console.log(`\nUsing package manager: ${pm}`);

  if (pm === "npm") {
    if (devPackages) {
      execSync(`npm install --save ${packages} --save-dev ${devPackages}`, { stdio: "inherit" });
    } else {
      execSync(`npm install ${packages}`, { stdio: "inherit" });
    }
  } else if (pm === "bun") {
    if (devPackages) {
      execSync(`bun add ${packages} && bun add -d ${devPackages}`, { stdio: "inherit" });
    } else {
      execSync(`bun add ${packages}`, { stdio: "inherit" });
    }
  } else if (pm === "pnpm") {
    if (devPackages) {
      execSync(`pnpm add ${packages} && pnpm add -D ${devPackages}`, { stdio: "inherit" });
    } else {
      execSync(`pnpm add ${packages}`, { stdio: "inherit" });
    }
  } else if (pm === "yarn") {
    if (devPackages) {
      execSync(`yarn add ${packages} && yarn add -D ${devPackages}`, { stdio: "inherit" });
    } else {
      execSync(`yarn add ${packages}`, { stdio: "inherit" });
    }
  }
}

module.exports = { install, getPackageManager };

