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
 * Install dependencies based on language, runtime, architecture, database, hashing, and JWT
 */
function install(language, runtime, architecture, database = "none", hashing = "bcrypt", useJwt = false) {
  // Base packages: runtime + nodemon + cors + dotenv
  let packages = `${runtime} nodemon cors dotenv`;

  // For Fastify, use @fastify/cors instead of cors
  if (runtime === "fastify") {
    packages = `${runtime} nodemon @fastify/cors dotenv`;
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

  // Single npm install command
  if (devPackages) {
    // Install both regular and dev dependencies in one command
    execSync(`npm install --save ${packages} --save-dev ${devPackages}`, { stdio: "inherit" });
  } else {
    execSync(`npm install ${packages}`, { stdio: "inherit" });
  }
}

module.exports = { install };
