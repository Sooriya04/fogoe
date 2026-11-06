const fs = require('fs');
const path = require('path');

/**
 * Generate a machine-readable agent manifest contract (fogoe.agent.json)
 * Explains project layout, conventions, and CLI instructions for AI coding agents.
 *
 * @param {Object} options Configuration parameters
 * @param {string} options.targetDir Base directory of the project
 * @param {string} options.name Name of the project
 * @param {string} options.runtime Backend runtime (express, fastify, hono, koa)
 * @param {string} options.language Language (ts, js)
 * @param {string} options.architecture Architecture (minimal, mvc)
 * @param {string} options.type Module system (cjs, esm)
 * @param {string} options.database Database driver or ORM (mongodb, prisma, drizzle, sqlite, postgresql, mysql, none)
 * @param {string} options.auth Auth strategy (jwt, none)
 * @param {string} options.port Port number
 * @param {Array<string>} options.addons Active plugins and addons
 * @returns {Object} The generated agent manifest object
 */
function buildAgentManifest(options = {}) {
  const {
    name = 'fogoe-app',
    runtime = 'express',
    language = 'ts',
    architecture = 'mvc',
    type = 'cjs',
    database = 'none',
    auth = 'none',
    port = 3000,
    addons = [],
  } = options;

  const isTs = language === 'ts' || language === 'typescript';
  const ext = isTs ? 'ts' : 'js';
  const isMvc = architecture === 'mvc';

  // Entry points & structural paths
  const paths = {
    root: '.',
    entryPoint: `src/server.${ext}`,
    app: `src/app.${ext}`,
    env: '.env',
    config: 'fogoe.config.json',
    packageJson: 'package.json',
  };

  if (isMvc) {
    paths.routes = 'src/routes';
    paths.controllers = 'src/controllers';
    paths.models = 'src/models';
    paths.middlewares = 'src/middlewares';
    paths.configDir = 'src/config';
  } else {
    paths.routes = 'src/routes';
    paths.middlewares = 'src/middlewares';
  }

  if (isTs) {
    paths.tsconfig = 'tsconfig.json';
  }

  if (database === 'prisma') {
    paths.schema = 'prisma/schema.prisma';
  } else if (database === 'drizzle') {
    paths.schema = `src/models/schema.${ext}`;
    paths.drizzleConfig = `drizzle.config.${ext}`;
  }

  // Convention rules for agents
  const conventions = {
    extension: ext,
    moduleFormat: type === 'esm' || type === 'module' ? 'ESModules (import/export)' : 'CommonJS (require/module.exports)',
    pathAliases: isTs ? { '@routes/*': './src/routes/*', '@controllers/*': './src/controllers/*' } : null,
    restEndpointsPattern: '/api/<resource>',
    envSecretHandling: 'Never commit .env. Use process.env.<KEY> with dotenv loaded in server entry point.',
  };

  // Safe CLI generation recipes that the agent can execute directly
  const recipes = {
    generateCrud: 'npx fogoe generate crud <name>',
    generateRoute: 'npx fogoe generate route <name>',
    generateController: 'npx fogoe generate controller <name>',
    generateModel: 'npx fogoe generate model <name>',
    addNpmPackage: 'npx fogoe add <package> [-D] [--json]',
    removeNpmPackage: 'npx fogoe remove <package> [--json]',
    doctorDiagnostics: 'npx fogoe doctor --json',
    doctorAutoFix: 'npx fogoe doctor --fix --yes --json',
    inspectStatus: 'npx fogoe status --json',
  };

  return {
    $schema: 'https://fogoe.dev/schema/agent-manifest.v1.json',
    fogoeVersion: '1.2.0',
    project: {
      name,
      runtime,
      language: isTs ? 'typescript' : 'javascript',
      architecture,
      database,
      auth,
      defaultPort: Number(port) || 3000,
      addons,
    },
    paths,
    conventions,
    recipes,
    agentInstructions: [
      `This backend was scaffolded with Fogoe (${runtime} + ${isTs ? 'TypeScript' : 'JavaScript'} + ${architecture.toUpperCase()}).`,
      isMvc
        ? 'Always place business logic in src/controllers, route handlers in src/routes, and data schemas in src/models.'
        : 'This is a minimal architecture. Place endpoints in src/routes and attach them to the main app.',
      'To scaffold new vertical slices cleanly, prefer running "npx fogoe generate crud <name>" instead of creating files manually.',
      'To install or uninstall packages, use "npx fogoe add <pkg>" and "npx fogoe remove <pkg>" which auto-manage TypeScript @types and config addons.',
      'Run "npx fogoe doctor --json" to check project health or repair missing scripts and dependencies.',
    ],
  };
}

/**
 * Write fogoe.agent.json to target directory
 */
function writeAgentManifest(targetDir, options = {}) {
  const manifest = buildAgentManifest(options);
  const filePath = path.join(targetDir, 'fogoe.agent.json');
  fs.writeFileSync(filePath, JSON.stringify(manifest, null, 2) + '\n');
  return manifest;
}

/**
 * Get or regenerate project manifest from directory state
 */
function getProjectManifest(targetDir = process.cwd()) {
  const manifestPath = path.join(targetDir, 'fogoe.agent.json');
  if (fs.existsSync(manifestPath)) {
    try {
      return JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    } catch {}
  }

  // Fallback: derive options from fogoe.config.json and package.json
  const configPath = path.join(targetDir, 'fogoe.config.json');
  const pkgPath = path.join(targetDir, 'package.json');
  let config = {};
  let pkg = {};

  if (fs.existsSync(configPath)) {
    try {
      config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    } catch {}
  }
  if (fs.existsSync(pkgPath)) {
    try {
      pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    } catch {}
  }

  const defaults = config.defaults || {};
  return writeAgentManifest(targetDir, {
    name: pkg.name || path.basename(targetDir),
    runtime: defaults.runtime || 'express',
    language: defaults.language || (fs.existsSync(path.join(targetDir, 'tsconfig.json')) ? 'ts' : 'js'),
    architecture: defaults.arch || 'mvc',
    type: defaults.type || (pkg.type === 'module' ? 'esm' : 'cjs'),
    database: defaults.database || 'none',
    auth: defaults.auth || 'none',
    port: process.env.PORT || 3000,
    addons: config.addons || [],
  });
}

module.exports = {
  buildAgentManifest,
  writeAgentManifest,
  getProjectManifest,
};
