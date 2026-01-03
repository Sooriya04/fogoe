const fs = require("fs");

// Minimal templates
const minimalTemplates = {
  express: {
    commonjs: require("./templates/javascript/express/commonjs"),
    module: require("./templates/javascript/express/module")
  },
  fastify: {
    commonjs: require("./templates/javascript/fastify/commonjs"),
    module: require("./templates/javascript/fastify/module")
  }
};

// MVC templates (includes databases + hashing)
const mvcTemplates = {
  express: {
    commonjs: require("./templates/javascript/express/mvc-commonjs"),
    module: require("./templates/javascript/express/mvc-module")
  },
  fastify: {
    commonjs: require("./templates/javascript/fastify/mvc-commonjs"),
    module: require("./templates/javascript/fastify/mvc-module")
  }
};

/**
 * Scaffold a minimal project
 */
function scaffoldMinimal(runtime, type) {
  const template = minimalTemplates[runtime]?.[type];

  if (!template) {
    throw new Error(`Minimal template not found for runtime="${runtime}" and type="${type}"`);
  }

  fs.mkdirSync("src", { recursive: true });
  fs.writeFileSync("src/server.js", template);
  fs.writeFileSync(".env", "PORT=3000\n");
}

/**
 * Scaffold an MVC project
 */
function scaffoldMVC(runtime, type, database, hashing, useJwt) {
  const templates = mvcTemplates[runtime]?.[type];

  if (!templates) {
    throw new Error(`MVC template not found for runtime="${runtime}" and type="${type}"`);
  }

  // Get database templates
  const db = templates.databases[database] || templates.databases.none;
  
  // Get hashing template
  const hash = templates.hashing[hashing] || templates.hashing.bcrypt;

  // Create directories
  const dirs = [
    "src",
    "src/routes",
    "src/controllers",
    "src/middlewares",
    "src/utils",
    "src/functions",
    "src/models",
    "src/config"
  ];

  if (database === "prisma") {
    dirs.push("prisma");
  }

  dirs.forEach((dir) => fs.mkdirSync(dir, { recursive: true }));

  // Write core files
  fs.writeFileSync("src/server.js", templates.server);
  fs.writeFileSync("src/app.js", templates.app);
  fs.writeFileSync("src/routes/home.js", templates.homeRoute);
  fs.writeFileSync("src/controllers/homecontroller.js", templates.homeController);
  fs.writeFileSync("src/functions/helper.js", templates.helper);
  fs.writeFileSync("src/config/env.js", templates.envConfig);

  // Write auth middleware only if JWT is selected
  if (useJwt) {
    fs.writeFileSync("src/middlewares/authMiddleware.js", templates.authMiddleware);
  }

  // Write hashing file
  fs.writeFileSync("src/utils/hashing.js", hash);

  // Write database files
  fs.writeFileSync("src/config/db.js", db.dbConfig);
  fs.writeFileSync("src/models/model.js", db.model);
  
  // Write Prisma schema if using Prisma
  if (database === "prisma" && db.schema) {
    fs.writeFileSync("prisma/schema.prisma", db.schema);
  }

  fs.writeFileSync(".env", templates.envFile);
}

/**
 * Main scaffold function
 */
function scaffold(runtime, type, architecture, database = "none", hashing = "bcrypt", useJwt = false) {
  if (architecture === "mvc") {
    scaffoldMVC(runtime, type, database, hashing, useJwt);
  } else {
    scaffoldMinimal(runtime, type);
  }
}

module.exports = { scaffold };
