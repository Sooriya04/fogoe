const fs = require('fs');
const path = require('path');
const { buildPackageJson } = require('./packageJson');
const { buildTsConfig } = require('./tsconfig');

const TEMPLATES_ROOT = path.join(__dirname, '../templates');

/**
 * Recursively copy files from srcDir to destDir, applying variable replacements to text files.
 */
function copyTemplateDir(srcDir, destDir, vars = {}) {
  if (!fs.existsSync(srcDir)) return;

  const entries = fs.readdirSync(srcDir, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(srcDir, entry.name);
    const targetName = entry.name.endsWith('.tpl') ? entry.name.slice(0, -4) : entry.name;
    const destPath = path.join(destDir, targetName);

    if (entry.isDirectory()) {
      fs.mkdirSync(destPath, { recursive: true });
      copyTemplateDir(srcPath, destPath, vars);
    } else {
      fs.mkdirSync(path.dirname(destPath), { recursive: true });
      let content = fs.readFileSync(srcPath, 'utf8');

      // Apply variable substitutions
      for (const [key, val] of Object.entries(vars)) {
        const regex = new RegExp(`{{${key}}}`, 'g');
        content = content.replace(regex, val || '');
      }

      fs.writeFileSync(destPath, content);
    }
  }
}

/**
 * Composes a full project using real template files from disk.
 *
 * @param {Object} options Project configuration options
 */
function composeProject(options) {
  const {
    targetDir = process.cwd(),
    name = 'fogoe-app',
    version = '1.0.0',
    description = '',
    author = '',
    license = 'ISC',
    language = 'javascript',
    runtime = 'express',
    type = 'commonjs',
    architecture = 'minimal',
    database = 'none',
    hashing = 'bcrypt',
    useJwt = false,
    testing = false,
    linting = false,
  } = options;

  const isTypeScript = language === 'typescript';
  const typeCode = type === 'module' ? 'esm' : 'cjs';

  // Determine default DATABASE_URL
  const dbUrls = {
    mongodb: 'mongodb://localhost:27017/mydb',
    postgresql: 'postgresql://postgres:password@localhost:5432/mydb',
    mysql: 'mysql://root:password@localhost:3306/mydb',
    sqlite: 'dev.db',
    prisma: 'postgresql://postgres:password@localhost:5432/mydb',
    drizzle: 'postgresql://postgres:password@localhost:5432/mydb',
    none: '',
  };
  const databaseUrl = dbUrls[database] || '';

  const vars = {
    PROJECT_NAME: name,
    VERSION: version,
    DESCRIPTION: description || 'Node.js backend scaffolded with Fogoe',
    AUTHOR: author,
    LICENSE: license,
    PORT: '3000',
    JWT_SECRET: 'dev-secret',
    DATABASE_URL: databaseUrl,
    TEST_SECTION: testing ? '### Running Tests\n```bash\nnpm test\n```\n' : '',
    LINT_SECTION: linting ? '### Linting & Formatting\n```bash\nnpm run lint\nnpm run format\n```\n' : '',
  };

  fs.mkdirSync(targetDir, { recursive: true });

  // 1. Copy base templates (.gitignore, README.md)
  const baseDir = path.join(TEMPLATES_ROOT, 'base');
  copyTemplateDir(baseDir, targetDir, vars);

  // 1b. Write .env from .env.example
  const envExamplePath = path.join(targetDir, '.env.example');
  if (fs.existsSync(envExamplePath)) {
    const envContent = fs.readFileSync(envExamplePath, 'utf8');
    fs.writeFileSync(path.join(targetDir, '.env'), envContent);
  }

  // 2. Copy runtime template
  const runtimeDir = path.join(
    TEMPLATES_ROOT,
    'runtimes',
    runtime,
    language,
    typeCode,
    architecture,
  );
  if (!fs.existsSync(runtimeDir)) {
    throw new Error(`Runtime template not found: ${runtimeDir}`);
  }
  copyTemplateDir(runtimeDir, targetDir, vars);

  // 3. MVC specific templates
  if (architecture === 'mvc') {
    // 3a. Database template
    const dbDir = path.join(
      TEMPLATES_ROOT,
      'databases',
      database,
      language,
      typeCode,
    );
    if (fs.existsSync(dbDir)) {
      copyTemplateDir(dbDir, targetDir, vars);
    }

    // 3b. Hashing template
    const hashDir = path.join(
      TEMPLATES_ROOT,
      'hashing',
      hashing,
      language,
      typeCode,
    );
    if (fs.existsSync(hashDir)) {
      copyTemplateDir(hashDir, targetDir, vars);
    }

    // 3c. Auth (JWT) template
    if (useJwt) {
      const authDir = path.join(
        TEMPLATES_ROOT,
        'auth',
        'jwt',
        runtime,
        language,
        typeCode,
      );
      if (fs.existsSync(authDir)) {
        copyTemplateDir(authDir, targetDir, vars);
      }
    }
  }

  // 4. Tooling (Testing / Vitest)
  if (testing) {
    const testDir = path.join(
      TEMPLATES_ROOT,
      'tooling',
      'vitest',
      language,
      typeCode,
    );
    if (fs.existsSync(testDir)) {
      copyTemplateDir(testDir, targetDir, vars);
    }
  }

  // 5. Tooling (Linting / ESLint + Prettier)
  if (linting) {
    const lintConfigDir = path.join(TEMPLATES_ROOT, 'tooling', 'linting', language);
    if (fs.existsSync(lintConfigDir)) {
      copyTemplateDir(lintConfigDir, targetDir, vars);
    }
    const prettierrcSrc = path.join(TEMPLATES_ROOT, 'tooling', 'linting', '.prettierrc');
    if (fs.existsSync(prettierrcSrc)) {
      fs.copyFileSync(prettierrcSrc, path.join(targetDir, '.prettierrc'));
    }
  }

  // 6. Generate tsconfig.json for TypeScript projects
  if (isTypeScript) {
    const tsConfig = buildTsConfig(type, architecture);
    fs.writeFileSync(
      path.join(targetDir, 'tsconfig.json'),
      JSON.stringify(tsConfig, null, 2),
    );
  }

  // 7. Generate package.json
  const pkgData = buildPackageJson({
    name,
    version,
    description,
    author,
    license,
    type,
    language,
    database,
    testing,
    linting,
  });
  fs.writeFileSync(
    path.join(targetDir, 'package.json'),
    JSON.stringify(pkgData, null, 2),
  );

  return {
    targetDir,
    options,
  };
}

module.exports = { composeProject, copyTemplateDir };
