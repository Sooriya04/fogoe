const fs = require('fs');
const path = require('path');
const { intro, outro, input, select, confirm, spinner } = require('./prompts');
const { composeProject } = require('./composer');
const { install } = require('./installer');
const { addPlugin } = require('./plugins');
const { checkStatus } = require('./status');
const { updateProject } = require('./update');
const { generateComponent } = require('./generate');
const { parseAiPrompt } = require('./ai');
const chalk = require('chalk');

function parseCliArgs(args) {
  const flags = {
    framework: null,
    language: null,
    type: null,
    architecture: null,
    database: null,
    hashing: null,
    auth: null,
    jwt: null,
    testing: null,
    linting: null,
    install: null,
    git: null,
    yes: false,
    nonInteractive: false,
    ai: null,
    json: false,
    help: false,
    version: false,
  };
  const positionals = [];

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === '--help' || arg === '-h' || arg === 'help') {
      flags.help = true;
    } else if (arg === '--version' || arg === '-v' || arg === 'version') {
      flags.version = true;
    } else if (arg === '--yes' || arg === '-y') {
      flags.yes = true;
    } else if (arg === '--non-interactive') {
      flags.nonInteractive = true;
    } else if (arg === '--json') {
      flags.json = true;
    } else if (arg === '--ai') {
      flags.ai = args[++i];
    } else if (arg.startsWith('--ai=')) {
      flags.ai = arg.slice(5);
    } else if (arg === '--framework' || arg === '-f' || arg === '--runtime') {
      flags.framework = args[++i];
    } else if (arg.startsWith('--framework=')) {
      flags.framework = arg.split('=')[1];
    } else if (arg.startsWith('--runtime=')) {
      flags.framework = arg.split('=')[1];
    } else if (arg === '--lang' || arg === '-l' || arg === '--language') {
      flags.language = args[++i];
    } else if (arg.startsWith('--lang=') || arg.startsWith('--language=')) {
      flags.language = arg.split('=')[1];
    } else if (arg === '--type' || arg === '-t') {
      flags.type = args[++i];
    } else if (arg.startsWith('--type=')) {
      flags.type = arg.split('=')[1];
    } else if (arg === '--arch' || arg === '-a' || arg === '--architecture') {
      flags.architecture = args[++i];
    } else if (arg.startsWith('--arch=') || arg.startsWith('--architecture=')) {
      flags.architecture = arg.split('=')[1];
    } else if (arg === '--db' || arg === '-d' || arg === '--database') {
      flags.database = args[++i];
    } else if (arg.startsWith('--db=') || arg.startsWith('--database=')) {
      flags.database = arg.split('=')[1];
    } else if (arg === '--hashing') {
      flags.hashing = args[++i];
    } else if (arg.startsWith('--hashing=')) {
      flags.hashing = arg.split('=')[1];
    } else if (arg === '--auth') {
      flags.auth = args[++i];
    } else if (arg.startsWith('--auth=')) {
      flags.auth = arg.split('=')[1];
    } else if (arg === '--jwt') {
      flags.jwt = true;
    } else if (arg === '--no-jwt') {
      flags.jwt = false;
    } else if (arg === '--test' || arg === '--testing') {
      flags.testing = true;
    } else if (arg === '--no-test' || arg === '--no-testing') {
      flags.testing = false;
    } else if (arg === '--lint' || arg === '--linting') {
      flags.linting = true;
    } else if (arg === '--no-lint' || arg === '--no-linting') {
      flags.linting = false;
    } else if (arg === '--install' || arg === '-i') {
      flags.install = true;
    } else if (arg === '--no-install') {
      flags.install = false;
    } else if (arg === '--git' || arg === '-g') {
      flags.git = true;
    } else if (arg === '--no-git') {
      flags.git = false;
    } else if (!arg.startsWith('-')) {
      positionals.push(arg);
    }
  }

  return { flags, positionals };
}

(async () => {
  const args = process.argv.slice(2);
  const { flags, positionals } = parseCliArgs(args);

  if (flags.version) {
    if (flags.json) {
      const pkg = require('../package.json');
      console.log(JSON.stringify({ version: pkg.version }));
      return;
    }
    const pkg = require('../package.json');
    console.log(chalk.cyan(`Fogoe CLI v${pkg.version}`));
    return;
  }

  if (flags.help) {
    console.log(chalk.cyan('\nFogoe CLI — Usage Guide\n'));
    console.log(chalk.yellow('Commands:'));
    console.log(`  ${chalk.green('fogoe [name]')}                 Start the interactive project initializer`);
    console.log(`  ${chalk.green('fogoe create <name> [flags]')}  Create a new project in a specific directory`);
    console.log(`  ${chalk.green('fogoe init')}                   Initialize Git repository and update config`);
    console.log(`  ${chalk.green('fogoe push <message>')}          Stage, commit, and push changes to remote`);
    console.log(`  ${chalk.green('fogoe add [plugin]')}            Add a plugin to an existing Fogoe project`);
    console.log(`  ${chalk.green('fogoe status')}                  Show project details and status`);
    console.log(`  ${chalk.green('fogoe update')}                  Upgrade project dependencies to latest`);
    console.log(`  ${chalk.green('fogoe generate <type> <name>')}  Generate route, controller, model, or full crud`);
    console.log(`  ${chalk.green('fogoe g crud <name>')}           Vertical slice: Model + Controller + Routes\n`);

    console.log(chalk.yellow('AI & Automation Flags:'));
    console.log(`  ${chalk.green('--ai "<prompt>"')}              Natural-language AI-assisted scaffolding`);
    console.log(`  ${chalk.green('--json')}                       Machine-readable JSON output for agents & CI`);
    console.log(`  ${chalk.green('--non-interactive')}           Run headlessly without interactive prompts\n`);

    console.log(chalk.yellow('CLI Flags (Non-Interactive Scaffolding):'));
    console.log(`  ${chalk.green('-f, --framework <name>')}       Runtime: express, fastify, hono, koa`);
    console.log(`  ${chalk.green('-l, --lang <language>')}        Language: js, ts (javascript, typescript)`);
    console.log(`  ${chalk.green('-t, --type <module>')}          Module type: cjs, esm (commonjs, module)`);
    console.log(`  ${chalk.green('-a, --arch <architecture>')}    Architecture: minimal, mvc`);
    console.log(`  ${chalk.green('-d, --db <database>')}          Database: mongodb, prisma, drizzle, mysql, postgres, sqlite, none`);
    console.log(`  ${chalk.green('--hashing <lib>')}              Hashing: bcrypt, argon2, crypto`);
    console.log(`  ${chalk.green('--auth <jwt|none>')}            Auth strategy`);
    console.log(`  ${chalk.green('--test, --no-test')}            Vitest testing suite`);
    console.log(`  ${chalk.green('--lint, --no-lint')}            ESLint + Prettier`);
    console.log(`  ${chalk.green('-i, --install')}                Auto-install dependencies`);
    console.log(`  ${chalk.green('-g, --git')}                    Auto-initialize git repository`);
    console.log(`  ${chalk.green('-y, --yes')}                    Accept default choices without prompting\n`);

    console.log(chalk.yellow('Available Plugins:'));
    console.log(`  ${chalk.cyan('redis')}      — Redis client (ioredis)`);
    console.log(`  ${chalk.cyan('zod')}        — Schema validation (zod)`);
    console.log(`  ${chalk.cyan('mailer')}     — Email via SMTP (nodemailer)`);
    console.log(`  ${chalk.cyan('stripe')}     — Payment processing (stripe)`);
    console.log(`  ${chalk.cyan('ratelimit')}  — Request rate limiting (express-rate-limit)`);
    console.log(`  ${chalk.cyan('swagger')}    — API docs (swagger-ui-express)`);
    console.log(`  ${chalk.cyan('socket')}     — Real-time events (socket.io)\n`);

    console.log(chalk.yellow('Examples:'));
    console.log(`  ${chalk.gray('# AI-Assisted Scaffolding')}`);
    console.log('  fogoe create my-api --ai "High-performance Fastify backend with Drizzle ORM and JWT in TypeScript"');
    console.log('  fogoe create blog --ai "Minimal Hono API with SQLite and Vitest tests"\n');
    console.log(`  ${chalk.gray('# Coding Agent & CI Automation (JSON output)')}`);
    console.log('  fogoe create my-api --framework fastify --lang ts --db postgres --auth jwt --json\n');
    console.log(`  ${chalk.gray('# Fully automated CLI scaffolding')}`);
    console.log('  fogoe create my-api --framework fastify --lang ts --db drizzle --auth jwt --install\n');
    console.log(`  ${chalk.gray('# Generate full CRUD vertical slice')}`);
    console.log('  fogoe g crud product');
    console.log('  fogoe generate crud user\n');
    return;
  }

  if (positionals[0] === 'push') {
    const message = positionals[1] || 'Update';
    if (!fs.existsSync('fogoe.config.json')) {
      console.error(chalk.red('fogoe.config.json not found. Are you in a Fogoe project?'));
      process.exit(1);
    }
    const config = JSON.parse(fs.readFileSync('fogoe.config.json', 'utf8'));
    if (!config.defaults || config.defaults.git === false) {
      console.error(chalk.red('Git not initialized. Run: fogoe init'));
      process.exit(1);
    }

    try {
      const { execSync } = require('child_process');
      const safeMsg = message.replace(/"/g, '\\"');
      execSync('git add .', { stdio: 'inherit' });
      execSync(`git commit -m "${safeMsg}"`, { stdio: 'inherit' });
      execSync('git push', { stdio: 'inherit' });
      console.log(chalk.green('✓ Repository pushed successfully'));
    } catch (err) {
      console.error(chalk.red('Failed to push changes. Ensure remote is configured.'));
      process.exit(1);
    }
    return;
  }

  if (positionals[0] === 'add') {
    const pluginName = positionals[1] || undefined;
    await addPlugin(pluginName);
    return;
  }

  if (positionals[0] === 'status') {
    checkStatus();
    return;
  }

  if (positionals[0] === 'update') {
    await updateProject();
    return;
  }

  if (positionals[0] === 'generate' || positionals[0] === 'g') {
    const typeArg = positionals[1];
    const nameArg = positionals[2];
    generateComponent(typeArg, nameArg);
    return;
  }

  if (positionals[0] === 'init') {
    if (!fs.existsSync('fogoe.config.json')) {
      console.error(chalk.red('fogoe.config.json not found. Are you in a Fogoe project?'));
      process.exit(1);
    }
    const { initGit } = require('./github');
    await initGit();

    const config = JSON.parse(fs.readFileSync('fogoe.config.json', 'utf8'));
    if (!config.defaults) {
      config.defaults = {};
    }
    config.defaults.git = true;
    fs.writeFileSync('fogoe.config.json', JSON.stringify(config, null, 2));
    console.log(chalk.green('✓ Updated fogoe.config.json with git: true'));
    return;
  }

  if (args.includes('git-init')) {
    const { initGit } = require('./github');
    await initGit();
    return;
  }

  // Parse AI prompt if provided
  let aiConfig = null;
  if (flags.ai) {
    aiConfig = parseAiPrompt(flags.ai);
  }

  // Determine target directory and initial package name
  let initialName = '';
  let targetDir = process.cwd();

  if (positionals[0] === 'create' && positionals[1]) {
    initialName = positionals[1];
    targetDir = path.resolve(process.cwd(), positionals[1]);
  } else if (positionals[0] && positionals[0] !== 'create') {
    initialName = positionals[0];
    targetDir = path.resolve(process.cwd(), positionals[0]);
  }

  // Determine if non-interactive mode should be active
  const hasExplicitFlags = Boolean(
    flags.yes ||
    flags.nonInteractive ||
    flags.json ||
    flags.ai ||
    flags.framework ||
    flags.language ||
    flags.type ||
    flags.architecture ||
    flags.database ||
    flags.auth ||
    flags.jwt !== null ||
    flags.install !== null ||
    flags.git !== null ||
    flags.testing !== null ||
    flags.linting !== null
  );

  const isNonInteractive = hasExplicitFlags;

  if (targetDir !== process.cwd()) {
    fs.mkdirSync(targetDir, { recursive: true });
    process.chdir(targetDir);
  }

  // Display banner unless in JSON mode
  if (!flags.json) {
    if (!isNonInteractive) {
      await intro(chalk.bold.cyan('Fogoe') + chalk.dim(' — Next-gen Node.js Scaffolding'));
    } else {
      console.log(chalk.cyan(`\nFogoe: Initializing project in ${targetDir}...`));
      if (aiConfig && aiConfig.summary.length > 0) {
        console.log(chalk.magenta('\n🤖 AI Requirements Interpreted:'));
        aiConfig.summary.forEach((item) => console.log(chalk.gray(`   • ${item}`)));
        console.log('');
      }
    }
  }

  // Check if directory is non-empty
  const files = fs.readdirSync(process.cwd());
  const hasExistingProjectFiles = files.some(
    (file) => file !== '.git' && file !== '.gitignore' && file !== 'README.md' && file !== 'LICENSE'
  );
  if (hasExistingProjectFiles) {
    if (!flags.json) {
      console.log(chalk.yellow('⚠ Warning: Current directory is not empty. Existing files may be overwritten.'));
    }
    if (!isNonInteractive) {
      const proceed = await select('Do you want to proceed?', ['yes', 'no']);
      if (proceed !== 'yes') {
        console.log(chalk.cyan('Aborted.'));
        process.exit(0);
      }
    }
  }

  // 1. Project metadata
  let name = initialName ? path.basename(initialName) : path.basename(process.cwd());
  if (!isNonInteractive && !initialName) {
    name = await input('Package name', name, (val) => {
      if (!val) return 'Package name is required';
      if (!/^[a-z0-9-_]+$/.test(val)) {
        return 'Package name must be lowercase, alphanumeric, and can contain hyphens/underscores';
      }
      return true;
    });
  }

  let version = '1.0.0';
  let description = '';
  let author = '';
  let license = 'ISC';

  if (!isNonInteractive && !flags.framework && !flags.language && !flags.ai) {
    version = (await input('Version', '1.0.0')) || '1.0.0';
    description = await input('Description');
    author = await input('Author');
    license = (await input('License', 'ISC')) || 'ISC';
  }

  // 2. Language selection
  let language = 'javascript';
  if (flags.language) {
    const l = flags.language.toLowerCase();
    language = (l === 'ts' || l === 'typescript') ? 'typescript' : 'javascript';
  } else if (aiConfig && aiConfig.language) {
    language = aiConfig.language;
  } else if (!isNonInteractive) {
    language = await select('Select language', [
      { value: 'javascript', label: 'JavaScript' },
      { value: 'typescript', label: 'TypeScript' },
    ]);
  }

  // 3. Module type selection
  let type = language === 'typescript' ? 'module' : 'commonjs';
  if (flags.type) {
    const t = flags.type.toLowerCase();
    type = (t === 'esm' || t === 'module') ? 'module' : 'commonjs';
  } else if (aiConfig && aiConfig.type) {
    type = aiConfig.type;
  } else if (!isNonInteractive) {
    type = await select('Select module type', [
      { value: 'commonjs', label: 'CommonJS (require/exports)' },
      { value: 'module', label: 'ES Modules (import/export)' },
    ]);
  }

  // 4. Runtime selection
  let runtime = 'express';
  if (flags.framework) {
    const r = flags.framework.toLowerCase();
    if (['express', 'fastify', 'hono', 'koa'].includes(r)) {
      runtime = r;
    }
  } else if (aiConfig && aiConfig.runtime) {
    runtime = aiConfig.runtime;
  } else if (!isNonInteractive) {
    runtime = await select('Select runtime', [
      { value: 'express', label: 'Express', hint: 'Fast, unopinionated, classic' },
      { value: 'fastify', label: 'Fastify', hint: 'High performance & low overhead' },
      { value: 'hono', label: 'Hono', hint: 'Ultrafast, modern web framework' },
      { value: 'koa', label: 'Koa', hint: 'Expressive HTTP middleware' },
    ]);
  }

  // 5. Architecture selection
  let architecture = 'minimal';
  if (flags.architecture) {
    const a = flags.architecture.toLowerCase();
    architecture = a === 'mvc' ? 'mvc' : 'minimal';
  } else if (flags.database || flags.auth || flags.jwt !== null) {
    architecture = 'mvc';
  } else if (aiConfig && aiConfig.architecture) {
    architecture = aiConfig.architecture;
  } else if (!isNonInteractive) {
    architecture = await select('Select architecture', [
      { value: 'minimal', label: 'Minimal', hint: 'Single-file or simple entry structure' },
      { value: 'mvc', label: 'MVC', hint: 'Models, Views/Routes, Controllers' },
    ]);
  }

  // 6. Tooling selection
  let testing = false;
  if (flags.testing !== null) {
    testing = flags.testing === true;
  } else if (aiConfig && aiConfig.testing) {
    testing = true;
  } else if (!isNonInteractive) {
    const testChoice = await select('Include testing suite (Vitest)?', ['yes', 'no']);
    testing = testChoice === 'yes';
  }

  let linting = false;
  if (flags.linting !== null) {
    linting = flags.linting === true;
  } else if (aiConfig && aiConfig.linting) {
    linting = true;
  } else if (!isNonInteractive) {
    const lintChoice = await select('Include linting & formatting (ESLint + Prettier)?', ['yes', 'no']);
    linting = lintChoice === 'yes';
  }

  // 7. MVC-specific options
  let database = 'none';
  let hashing = 'bcrypt';
  let useJwt = false;

  if (architecture === 'mvc') {
    if (flags.database) {
      const d = flags.database.toLowerCase();
      if (d === 'postgres' || d === 'postgresql' || d === 'pg') database = 'postgresql';
      else if (d === 'mongo' || d === 'mongodb') database = 'mongodb';
      else if (['prisma', 'drizzle', 'mysql', 'sqlite', 'none'].includes(d)) database = d;
    } else if (aiConfig && aiConfig.database) {
      database = aiConfig.database;
    } else if (!isNonInteractive) {
      database = await select('Select database', [
        { value: 'mongodb', label: 'MongoDB', hint: 'Mongoose ODM' },
        { value: 'prisma', label: 'Prisma', hint: 'Next-gen ORM with migrations' },
        { value: 'drizzle', label: 'Drizzle ORM', hint: 'TypeScript ORM with drizzle-kit' },
        { value: 'postgresql', label: 'PostgreSQL', hint: 'pg driver with connection pool' },
        { value: 'mysql', label: 'MySQL', hint: 'mysql2 driver' },
        { value: 'sqlite', label: 'SQLite', hint: 'better-sqlite3' },
        { value: 'none', label: 'None', hint: 'No database setup' },
      ]);
    }

    if (flags.hashing) {
      const h = flags.hashing.toLowerCase();
      if (['bcrypt', 'argon2', 'crypto'].includes(h)) hashing = h;
    } else if (aiConfig && aiConfig.hashing) {
      hashing = aiConfig.hashing;
    } else if (!isNonInteractive) {
      hashing = await select('Select hashing library', [
        { value: 'bcrypt', label: 'bcrypt' },
        { value: 'argon2', label: 'argon2' },
        { value: 'crypto', label: 'crypto (built-in)' },
      ]);
    }

    if (flags.jwt !== null) {
      useJwt = flags.jwt;
    } else if (flags.auth) {
      useJwt = flags.auth.toLowerCase() === 'jwt';
    } else if (aiConfig && aiConfig.useJwt !== undefined) {
      useJwt = aiConfig.useJwt;
    } else if (!isNonInteractive) {
      const jwtChoice = await select('Include jsonwebtoken?', ['yes', 'no']);
      useJwt = jwtChoice === 'yes';
    }
  }

  // Compose project files
  if (!isNonInteractive && !flags.json) {
    const s = await spinner();
    s.start('Scaffolding project files...');
    composeProject({
      targetDir: process.cwd(),
      name,
      version,
      description,
      author,
      license,
      language,
      runtime,
      type,
      architecture,
      database,
      hashing,
      useJwt,
      testing,
      linting,
    });
    s.stop(chalk.green('✓ Scaffolding complete'));
  } else {
    composeProject({
      targetDir: process.cwd(),
      name,
      version,
      description,
      author,
      license,
      language,
      runtime,
      type,
      architecture,
      database,
      hashing,
      useJwt,
      testing,
      linting,
    });
    if (!flags.json) {
      console.log(chalk.green('✓ Scaffolding complete'));
    }
  }

  // Install dependencies
  let installDeps = false;
  if (flags.install !== null) {
    installDeps = flags.install === true;
  } else if (aiConfig && aiConfig.install) {
    installDeps = true;
  } else if (!isNonInteractive) {
    const installChoice = await select('Install dependencies now?', ['yes', 'no']);
    installDeps = installChoice === 'yes';
  }

  if (installDeps) {
    if (!flags.json) {
      console.log(chalk.cyan('\nInstalling dependencies...\n'));
    }
    install(language, runtime, architecture, database, hashing, useJwt, testing, linting, flags.json);
    if (!flags.json) {
      console.log(chalk.green('\n✓ Dependencies installed'));
    }
  }

  // Git initialization
  let initGitRepo = false;
  if (flags.git !== null) {
    initGitRepo = flags.git === true;
  } else if (aiConfig && aiConfig.git) {
    initGitRepo = true;
  } else if (!isNonInteractive) {
    const gitChoice = await select('Initialize Git repository?', ['yes', 'no']);
    initGitRepo = gitChoice === 'yes';
  }

  // Write fogoe.config.json with project defaults
  const fogoeConfig = {
    defaults: {
      language: language === 'javascript' ? 'js' : 'ts',
      arch: architecture,
      runtime: runtime,
      type: type === 'commonjs' ? 'cjs' : 'esm',
      database: database,
      git: initGitRepo,
    },
  };

  fs.writeFileSync('fogoe.config.json', JSON.stringify(fogoeConfig, null, 2));

  if (initGitRepo) {
    const { initGit } = require('./github');
    await initGit();
  }

  // Machine-readable JSON output for Coding Agents and CI
  if (flags.json) {
    const createdFiles = [];
    function collectFiles(dir, relativeTo) {
      if (!fs.existsSync(dir)) return;
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          collectFiles(full, relativeTo);
        } else {
          createdFiles.push(path.relative(relativeTo, full).replace(/\\/g, '/'));
        }
      }
    }
    collectFiles(targetDir, targetDir);

    const jsonResult = {
      success: true,
      name,
      targetDir,
      config: {
        runtime,
        language: language === 'javascript' ? 'js' : 'ts',
        type: type === 'commonjs' ? 'cjs' : 'esm',
        architecture,
        database,
        hashing: architecture === 'mvc' ? hashing : undefined,
        useJwt: architecture === 'mvc' ? useJwt : undefined,
        testing,
        linting,
        git: initGitRepo,
        install: installDeps,
      },
      files: createdFiles.sort(),
    };

    if (aiConfig) {
      jsonResult.ai = {
        prompt: flags.ai,
        interpreted: aiConfig.summary,
      };
    }

    console.log(JSON.stringify(jsonResult, null, 2));
    return;
  }

  if (!isNonInteractive) {
    await outro(chalk.bold.green('Fogoe project ready! 🚀'));
  } else {
    console.log(chalk.bold.green('\nFogoe project ready! 🚀'));
  }

  // Database-specific instructions
  if (database === 'prisma') {
    console.log(chalk.yellow('\nPrisma setup:'));
    console.log(chalk.yellow('   1. Update DATABASE_URL in .env'));
    console.log(chalk.yellow('   2. Run: npx prisma generate'));
    console.log(chalk.yellow('   3. Run: npx prisma db push'));
    console.log(chalk.yellow('   4. Then run: npm run dev\n'));
  } else if (database === 'drizzle') {
    console.log(chalk.yellow('\nDrizzle ORM setup:'));
    console.log(chalk.yellow('   1. Update DATABASE_URL in .env'));
    console.log(chalk.yellow('   2. Run: npm run db:generate'));
    console.log(chalk.yellow('   3. Run: npm run db:migrate'));
    console.log(chalk.yellow('   4. Then run: npm run dev\n'));
  } else {
    console.log(chalk.cyan('\nnpm run dev\n'));
  }
})();
