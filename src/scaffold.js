const fs = require("fs");
const { buildTsConfig } = require("./tsconfig");

// Minimal templates - JavaScript
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

// Minimal templates - TypeScript
const minimalTemplatesTS = {
  express: {
    commonjs: require("./templates/typescript/express/commonjs"),
    module: require("./templates/typescript/express/module")
  },
  fastify: {
    commonjs: require("./templates/typescript/fastify/commonjs"),
    module: require("./templates/typescript/fastify/module")
  }
};

// MVC templates - JavaScript (includes databases + hashing)
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

// MVC templates - TypeScript
const mvcTemplatesTS = {
  express: {
    commonjs: require("./templates/typescript/express/mvc-commonjs"),
    module: require("./templates/typescript/express/mvc-module")
  },
  fastify: {
    commonjs: require("./templates/typescript/fastify/mvc-commonjs"),
    module: require("./templates/typescript/fastify/mvc-module")
  }
};

/**
 * Scaffold a minimal project
 */
function scaffoldMinimal(language, runtime, type) {
  const isTypeScript = language === "typescript";
  const templates = isTypeScript ? minimalTemplatesTS : minimalTemplates;
  const template = templates[runtime]?.[type];

  if (!template) {
    throw new Error(`Minimal template not found for runtime="${runtime}" and type="${type}"`);
  }

  const ext = isTypeScript ? "ts" : "js";

  fs.mkdirSync("src", { recursive: true });
  fs.writeFileSync(`src/server.${ext}`, template);
  fs.writeFileSync(".env", "PORT=3000\n");

  // Generate tsconfig.json for TypeScript projects
  if (isTypeScript) {
    const tsConfig = buildTsConfig(type, "minimal");
    fs.writeFileSync("tsconfig.json", JSON.stringify(tsConfig, null, 2));
  }
}

/**
 * Scaffold an MVC project
 */
function scaffoldMVC(language, runtime, type, database, hashing, useJwt) {
  const isTypeScript = language === "typescript";
  const templates = isTypeScript ? mvcTemplatesTS[runtime]?.[type] : mvcTemplates[runtime]?.[type];

  if (!templates) {
    throw new Error(`MVC template not found for runtime="${runtime}" and type="${type}"`);
  }

  // Get database templates
  const db = templates.databases[database] || templates.databases.none;
  
  // Get hashing template
  const hash = templates.hashing[hashing] || templates.hashing.bcrypt;

  const ext = isTypeScript ? "ts" : "js";

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
  fs.writeFileSync(`src/server.${ext}`, templates.server);
  fs.writeFileSync(`src/app.${ext}`, templates.app);
  fs.writeFileSync(`src/routes/home.${ext}`, templates.homeRoute);
  fs.writeFileSync(`src/controllers/homecontroller.${ext}`, templates.homeController);
  fs.writeFileSync(`src/functions/helper.${ext}`, templates.helper);
  fs.writeFileSync(`src/config/env.${ext}`, templates.envConfig);

  // Write auth middleware only if JWT is selected
  if (useJwt) {
    fs.writeFileSync(`src/middlewares/authMiddleware.${ext}`, templates.authMiddleware);
  }

  // Write hashing file
  fs.writeFileSync(`src/utils/hashing.${ext}`, hash);

  // Write database files
  fs.writeFileSync(`src/config/db.${ext}`, db.dbConfig);
  fs.writeFileSync(`src/models/model.${ext}`, db.model);
  
  // Write Prisma schema if using Prisma
  if (database === "prisma" && db.schema) {
    fs.writeFileSync("prisma/schema.prisma", db.schema);
  }

  fs.writeFileSync(".env", templates.envFile);

  // Generate tsconfig.json for TypeScript projects
  if (isTypeScript) {
    const tsConfig = buildTsConfig(type, "mvc");
    fs.writeFileSync("tsconfig.json", JSON.stringify(tsConfig, null, 2));
  }
}

/**
 * Main scaffold function
 */
function scaffold(language, runtime, type, architecture, database = "none", hashing = "bcrypt", useJwt = false) {
  if (architecture === "mvc") {
    scaffoldMVC(language, runtime, type, database, hashing, useJwt);
  } else {
    scaffoldMinimal(language, runtime, type);
  }
}

module.exports = { scaffold };
