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

/**
 * Install dependencies based on runtime, architecture, database, hashing, and JWT
 */
function install(runtime, architecture, database = "none", hashing = "bcrypt", useJwt = false) {
  // Base packages: runtime + nodemon + cors + dotenv
  let packages = `${runtime} nodemon cors dotenv`;

  // For Fastify, use @fastify/cors instead of cors
  if (runtime === "fastify") {
    packages = `${runtime} nodemon @fastify/cors dotenv`;
  }

  // MVC architecture needs additional packages
  if (architecture === "mvc") {
    // Add hashing package
    packages += ` ${hashPackages[hashing]}`;
    
    // Add JWT if selected
    if (useJwt) {
      packages += " jsonwebtoken";
    }
    
    // Add database package if selected
    if (database && database !== "none") {
      packages += ` ${dbPackages[database]}`;
    }
  }

  execSync(`npm install ${packages}`, { stdio: "inherit" });
}

module.exports = { install };
