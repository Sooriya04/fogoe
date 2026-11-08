const { execFileSync } = require("child_process");
const fs = require("fs");
const path = require("path");

// Database package mapping
const dbPackages = {
  mongodb: "mongoose",
  prisma: "@prisma/client",
  drizzle: "drizzle-orm pg",
  mysql: "mysql2",
  postgresql: "pg",
  postgres: "pg",
  pg: "pg",
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
  drizzle: "@types/pg",
  mysql: "@types/mysql2",
  postgresql: "@types/pg",
  postgres: "@types/pg",
  pg: "@types/pg",
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
 * Defaults to 'npm' unless invoked via bun/pnpm/yarn or a lockfile is detected.
 * @param {string|null} preferredPm
 * @param {string} targetDir
 */
function getPackageManager(preferredPm = null, targetDir = process.cwd()) {
  if (preferredPm && ["npm", "pnpm", "bun", "yarn"].includes(preferredPm.toLowerCase())) {
    return preferredPm.toLowerCase();
  }

  const agent = process.env.npm_config_user_agent || "";
  if (agent.startsWith("bun")) return "bun";
  if (agent.startsWith("pnpm")) return "pnpm";
  if (agent.startsWith("yarn")) return "yarn";
  if (agent.startsWith("npm")) return "npm";

  if (fs.existsSync(path.join(targetDir, "bun.lockb")) || fs.existsSync(path.join(targetDir, "bun.lock"))) return "bun";
  if (fs.existsSync(path.join(targetDir, "pnpm-lock.yaml"))) return "pnpm";
  if (fs.existsSync(path.join(targetDir, "yarn.lock"))) return "yarn";
  if (fs.existsSync(path.join(targetDir, "package-lock.json"))) return "npm";

  return "npm";
}

/**
 * Install dependencies based on language, runtime, architecture, database, hashing, and JWT
 */
function install(language, runtime, architecture, database = "none", hashing = "bcrypt", useJwt = false, testing = false, linting = false, silent = false, preferredPm = null) {
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
      } else if (database === "drizzle") {
        packages += ` ${dbPackages.drizzle}`;
        devPackages += (devPackages ? " " : "") + "drizzle-kit";
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

  const pm = getPackageManager(preferredPm);
  if (!silent) {
    console.log(`\nUsing package manager: ${pm}`);
  }

  const trimPkgs = packages.trim();
  const trimDev = devPackages.trim();
  installPackageList({ packages: trimPkgs, devPackages: trimDev, pm, silent });
}

/**
 * Universal safe package installer helper.
 * Uses execFileSync with discrete argument arrays to prevent shell injection.
 */
function installPackageList({ packages = "", devPackages = "", pm = null, silent = false }) {
  const activePm = pm || getPackageManager();
  const stdio = silent ? "ignore" : "inherit";

  const splitPkgs = (typeof packages === "string" ? packages.split(" ") : packages).filter(Boolean);
  const splitDev = (typeof devPackages === "string" ? devPackages.split(" ") : devPackages).filter(Boolean);

  if (splitPkgs.length === 0 && splitDev.length === 0) return;

  const isWindows = process.platform === 'win32';

  const runCmd = (cmd, args) => {
    try {
      execFileSync(cmd, args, { stdio, shell: isWindows });
      return true;
    } catch {
      return false;
    }
  };

  if (activePm === "npm") {
    if (splitPkgs.length > 0) runCmd("npm", ["install", "--save", ...splitPkgs]);
    if (splitDev.length > 0) runCmd("npm", ["install", "--save-dev", ...splitDev]);
  } else if (activePm === "bun") {
    if (splitPkgs.length > 0) runCmd("bun", ["add", ...splitPkgs]);
    if (splitDev.length > 0) runCmd("bun", ["add", "-d", ...splitDev]);
  } else if (activePm === "pnpm") {
    let success = true;
    if (splitPkgs.length > 0) {
      success = runCmd("pnpm", ["add", ...splitPkgs, "--config.dangerouslyAllowAllBuilds=true"]);
    }
    if (success && splitDev.length > 0) {
      success = runCmd("pnpm", ["add", "-D", ...splitDev, "--config.dangerouslyAllowAllBuilds=true"]);
    }

    if (!success) {
      // In pnpm v10+, build scripts might fail, retry plain pnpm add or fall back to npm
      let retrySuccess = true;
      if (splitPkgs.length > 0) retrySuccess = runCmd("pnpm", ["add", ...splitPkgs]);
      if (retrySuccess && splitDev.length > 0) retrySuccess = runCmd("pnpm", ["add", "-D", ...splitDev]);

      if (!retrySuccess) {
        if (!silent) {
          console.warn("\npnpm install encountered build script restrictions; falling back to npm...");
        }
        if (splitPkgs.length > 0) runCmd("npm", ["install", "--save", ...splitPkgs]);
        if (splitDev.length > 0) runCmd("npm", ["install", "--save-dev", ...splitDev]);
      }
    }
  } else if (activePm === "yarn") {
    if (splitPkgs.length > 0) runCmd("yarn", ["add", ...splitPkgs]);
    if (splitDev.length > 0) runCmd("yarn", ["add", "-D", ...splitDev]);
  }
}

/**
 * Universal safe package uninstaller helper.
 * Uses execFileSync with discrete argument arrays to prevent shell injection.
 * Safely handles execution errors without unhandled process termination.
 */
function uninstallPackageList({ packages = "", pm = null, silent = false }) {
  const activePm = pm || getPackageManager();
  const stdio = silent ? "ignore" : "inherit";

  const splitPkgs = (typeof packages === "string" ? packages.split(" ") : packages).filter(Boolean);
  if (splitPkgs.length === 0) return true;

  const isWindows = process.platform === 'win32';

  try {
    if (activePm === "npm") {
      execFileSync("npm", ["uninstall", ...splitPkgs], { stdio, shell: isWindows });
    } else if (activePm === "bun") {
      execFileSync("bun", ["remove", ...splitPkgs], { stdio, shell: isWindows });
    } else if (activePm === "pnpm") {
      execFileSync("pnpm", ["remove", ...splitPkgs], { stdio, shell: isWindows });
    } else if (activePm === "yarn") {
      execFileSync("yarn", ["remove", ...splitPkgs], { stdio, shell: isWindows });
    }
    return true;
  } catch (err) {
    if (!silent) {
      console.warn(`\nWarning: Failed to uninstall packages via ${activePm}: ${err.message}`);
    }
    return false;
  }
}

module.exports = {
  install,
  getPackageManager,
  installPackageList,
  uninstallPackageList,
};
