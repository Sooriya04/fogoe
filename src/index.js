const fs = require('fs');
const { input, select } = require('./prompts');
const { scaffold } = require('./scaffold');
const { buildPackageJson } = require('./packageJson');
const { install } = require('./installer');
const { addPlugin } = require('./plugins');
const { checkStatus } = require('./status');
const { updateProject } = require('./update');
const { generateComponent } = require('./generate');
const chalk = require('chalk');

(async () => {
  // Check arguments
  const args = process.argv.slice(2);

  if (args.includes('--version') || args.includes('-v') || args[0] === 'version') {
    const pkg = require('../package.json');
    console.log(chalk.cyan(`Fogoe CLI v${pkg.version}`));
    return;
  }

  if (args.includes('--help') || args.includes('-h') || args[0] === 'help') {
    console.log(chalk.cyan('\nFogoe CLI - Usage Guide\n'));
    console.log(chalk.yellow('Commands:'));
    console.log(`  ${chalk.green('fogoe')}                        Start the interactive project initializer`);
    console.log(`  ${chalk.green('fogoe init')}                   Initialize Git repository and update config`);
    console.log(`  ${chalk.green('fogoe push <message>')}          Stage, commit, and push changes to remote`);
    console.log(`  ${chalk.green('fogoe add [plugin]')}            Add a plugin to an existing Fogoe project`);
    console.log(`  ${chalk.green('fogoe status')}                  Show project details and status`);
    console.log(`  ${chalk.green('fogoe update')}                  Upgrade project dependencies to latest`);
    console.log(`  ${chalk.green('fogoe generate <type> <name>')}  Generate MVC route, controller, or model\n`);

    console.log(chalk.yellow('Available Plugins:'));
    console.log(`  ${chalk.cyan('redis')}      — Redis client (ioredis)`);
    console.log(`  ${chalk.cyan('zod')}        — Schema validation (zod)`);
    console.log(`  ${chalk.cyan('mailer')}     — Email via SMTP (nodemailer)`);
    console.log(`  ${chalk.cyan('stripe')}     — Payment processing (stripe)`);
    console.log(`  ${chalk.cyan('ratelimit')}  — Request rate limiting (express-rate-limit)`);
    console.log(`  ${chalk.cyan('swagger')}    — API docs (swagger-ui-express)`);
    console.log(`  ${chalk.cyan('socket')}     — Real-time events (socket.io)\n`);

    console.log(chalk.yellow('Examples:'));
    console.log(`  ${chalk.gray('# Using npx (no installation required)')}`);
    console.log('  npx fogoe');
    console.log('  npx fogoe init');
    console.log('  npx fogoe push "feat: add login"');
    console.log('  npx fogoe add redis');
    console.log('  npx fogoe status');
    console.log('  npx fogoe update');
    console.log('  npx fogoe generate route user\n');

    console.log(`  ${chalk.gray('# If installed globally (npm install -g fogoe)')}`);
    console.log('  fogoe add stripe');
    console.log('  fogoe status');
    console.log('  fogoe update');
    console.log('  fogoe generate controller user\n');
    return;
  }

  if (args[0] === 'push') {
    const message = args[1] || 'Update';
    if (!fs.existsSync('fogoe.config.json')) {
      console.error(chalk.red('fogoe.config.json not found. Are you in a Fogoe project?'));
      process.exit(1);
    }
    const config = JSON.parse(fs.readFileSync('fogoe.config.json', 'utf8'));
    if (!config.defaults || config.defaults.git === false) {
      console.error(chalk.red('Git not initialized. Run: fogoe init'));
      process.exit(1);
    }

    // Config has git: true
    try {
      const { execSync } = require('child_process');
      execSync('git add .', { stdio: 'inherit' });
      execSync(`git commit -m "${message}"`, { stdio: 'inherit' });
      execSync('git push', { stdio: 'inherit' });
      console.log(chalk.green('✓ Repository pushed successfully'));
    } catch (err) {
      console.error(chalk.red('Failed to push changes. Ensure remote is configured.'));
      process.exit(1);
    }
    return;
  }

  if (args[0] === 'add') {
    // fogoe add [pluginName] — add a plugin to an existing project
    // pluginName is optional; if omitted, shows interactive picker
    const pluginName = args[1] || undefined;
    await addPlugin(pluginName);
    return;
  }

  if (args[0] === 'status') {
    checkStatus();
    return;
  }

  if (args[0] === 'update') {
    await updateProject();
    return;
  }

  if (args[0] === 'generate' || args[0] === 'g') {
    const typeArg = args[1];
    const nameArg = args[2];
    generateComponent(typeArg, nameArg);
    return;
  }

  if (args[0] === 'init') {
    if (!fs.existsSync('fogoe.config.json')) {
      console.error(chalk.red('fogoe.config.json not found. Are you in a Fogoe project?'));
      process.exit(1);
    }
    const { initGit } = require('./github');
    await initGit();

    // Update config after initialization
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

  console.log('\nFogoe Initializer\n');

  // Check if directory is non-empty
  const files = fs.readdirSync(process.cwd());
  const hasExistingProjectFiles = files.some(file => 
    file !== '.git' && file !== '.gitignore' && file !== 'README.md' && file !== 'LICENSE'
  );
  if (hasExistingProjectFiles) {
    console.log(chalk.yellow('⚠ Warning: Current directory is not empty. Existing files may be overwritten.'));
    const proceed = await select('Do you want to proceed?', ['yes', 'no']);
    if (proceed !== 'yes') {
      console.log(chalk.cyan('Aborted.'));
      process.exit(0);
    }
  }

  // Project metadata
  const name = await input('Package name', '', (val) => {
    if (!val) return 'Package name is required';
    if (!/^[a-z0-9-_]+$/.test(val)) {
      return 'Package name must be lowercase, alphanumeric, and can contain hyphens/underscores';
    }
    return true;
  });
  const version = (await input('Version', '1.0.0')) || '1.0.0';
  const description = await input('Description');
  const author = await input('Author');
  const license = (await input('License', 'ISC')) || 'ISC';

  // Module type selection
  const type = await select('Select module type', ['commonjs', 'module']);

  // Language selection
  const language = await select('Select language', [
    'javascript',
    'typescript',
  ]);

  // Runtime selection
  const runtime = await select('Select runtime', ['express', 'fastify', 'hono', 'koa']);

  // Architecture selection
  const architecture = await select('Select architecture', ['minimal', 'mvc']);

  // Tooling selection
  const testing = await select('Include testing suite (Vitest)?', ['yes', 'no']);
  const linting = await select('Include linting & formatting (ESLint + Prettier)?', ['yes', 'no']);

  // MVC-specific options
  let database = 'none';
  let hashing = 'bcrypt';
  let useJwt = false;

  if (architecture === 'mvc') {
    // Database selection
    database = await select('Select database', [
      'mongodb',
      'prisma',
      'mysql',
      'postgresql',
      'none',
    ]);

    // Hashing selection
    hashing = await select('Select hashing library', [
      'bcrypt',
      'argon2',
      'crypto',
    ]);

    // JWT selection
    const jwtChoice = await select('Include jsonwebtoken?', ['yes', 'no']);
    useJwt = jwtChoice === 'yes';
  }

  // Write package.json
  fs.writeFileSync(
    'package.json',
    JSON.stringify(
      buildPackageJson({
        name,
        version,
        description,
        author,
        license,
        type,
        language,
        testing: testing === 'yes',
        linting: linting === 'yes',
      }),
      null,
      2,
    ),
  );

  // Scaffold the project
  scaffold(language, runtime, type, architecture, database, hashing, useJwt, testing === 'yes', linting === 'yes');

  // Install dependencies
  console.log('\nInstalling dependencies...\n');
  install(language, runtime, architecture, database, hashing, useJwt, testing === 'yes', linting === 'yes');

  console.log('\n');

  // Git initialization (optional)
  const gitChoice = await select('Initialize Git repository?', ['yes', 'no']);

  // Write fogoe.config.json with project defaults
  const fogoeConfig = {
    defaults: {
      language: language === 'javascript' ? 'js' : 'ts',
      arch: architecture,
      runtime: runtime,
      type: type === 'commonjs' ? 'cjs' : 'esm',
      git: gitChoice === 'yes',
    },
  };

  fs.writeFileSync('fogoe.config.json', JSON.stringify(fogoeConfig, null, 2));

  if (gitChoice === 'yes') {
    const { initGit } = require('./github');
    await initGit();
  }

  // Show completion message and instructions after git process
  console.log('\n');
  console.log(chalk.green('Fogoe project ready'));

  // Prisma-specific instructions
  if (database === 'prisma') {
    console.log(chalk.yellow('\nPrisma setup:'));
    console.log(chalk.yellow('   1. Update DATABASE_URL in .env'));
    console.log(chalk.yellow('   2. Run: npx prisma generate'));
    console.log(chalk.yellow('   3. Run: npx prisma db push'));
    console.log(chalk.yellow('   4. Then run: npm run dev\n'));
  } else {
    console.log(chalk.cyan('\nnpm run dev'));
  }
})();
