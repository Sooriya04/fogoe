const fs = require('fs');
const path = require('path');

/**
 * Generates stack-specific gitignore content
 * @param {Object} stack - { language, runtime, database, testing, linting }
 * @returns {string}
 */
function generateGitignoreContent(stack = {}) {
  const sections = [];

  // 1. Dependency directories
  sections.push(`# Dependencies\nnode_modules/\n.pnp/\n.pnp.js`);

  // 2. Environment variables & local secrets
  sections.push(`# Environment Variables & Secrets\n.env\n.env.local\n.env.*.local\n*.env\n!.env.example`);

  // 3. Runtime & Process logs
  sections.push(`# Logs\nlogs/\n*.log\nnpm-debug.log*\nyarn-debug.log*\nyarn-error.log*\npnpm-debug.log*`);

  // 4. Build & Distribution artifacts
  const lang = (stack.language || '').toLowerCase();
  if (lang === 'typescript' || lang === 'ts') {
    sections.push(`# Build & Compilation Outputs\ndist/\nbuild/\n*.tsbuildinfo`);
  } else {
    sections.push(`# Build & Compilation Outputs\ndist/\nbuild/`);
  }

  // 5. Testing & Code Coverage
  sections.push(`# Testing & Code Coverage\ncoverage/\n.nyc_output/`);

  // 6. Database & Local Store files
  const db = (stack.database || '').toLowerCase();
  const dbEntries = [];
  if (db === 'sqlite' || db.includes('sqlite')) {
    dbEntries.push('*.db', '*.db-journal', '*.sqlite', '*.sqlite3', '*.sqlite-journal');
  }
  if (db === 'prisma') {
    dbEntries.push('prisma/*.db', 'prisma/*.db-journal');
  }
  if (db === 'drizzle') {
    dbEntries.push('.drizzle/');
  }
  if (dbEntries.length > 0) {
    sections.push(`# Database Artifacts (${db})\n${dbEntries.join('\n')}`);
  }

  // 7. System & OS Files
  sections.push(`# System & OS\n.DS_Store\nThumbs.db`);

  // 8. IDEs & Editors
  sections.push(`# IDEs & Editors\n.idea/\n.vscode/*\n!.vscode/settings.json\n!.vscode/extensions.json\n*.suo\n*.ntvs*\n*.njsproj\n*.sln\n*.sw?`);

  return sections.join('\n\n') + '\n';
}

/**
 * Creates or updates .gitignore file with stack-aware rules
 * @param {Object} stack - { language, runtime, database, testing, linting }
 * @param {string} targetDir - directory of the project
 * @returns {string} The final .gitignore content
 */
function setupGitignore(stack = {}, targetDir = process.cwd()) {
  const gitignorePath = path.join(targetDir, '.gitignore');

  if (!fs.existsSync(gitignorePath)) {
    const content = generateGitignoreContent(stack);
    fs.writeFileSync(gitignorePath, content, 'utf8');
    return content;
  }

  let currentContent = fs.readFileSync(gitignorePath, 'utf8');
  const requiredRules = [
    'node_modules/',
    '.env',
    'dist/',
    'coverage/',
    '*.log',
    '.DS_Store',
  ];

  const lang = (stack.language || '').toLowerCase();
  if (lang === 'typescript' || lang === 'ts') {
    requiredRules.push('*.tsbuildinfo');
  }

  const db = (stack.database || '').toLowerCase();
  if (db === 'sqlite' || db.includes('sqlite')) {
    requiredRules.push('*.db', '*.sqlite', '*.db-journal');
  }
  if (db === 'prisma') {
    requiredRules.push('prisma/*.db');
  }
  if (db === 'drizzle') {
    requiredRules.push('.drizzle/');
  }

  const missingRules = requiredRules.filter((rule) => !currentContent.includes(rule));

  if (missingRules.length > 0) {
    const toAppend = '\n# Stack Additions\n' + missingRules.join('\n') + '\n';
    fs.appendFileSync(gitignorePath, toAppend, 'utf8');
    currentContent += toAppend;
  }

  return currentContent;
}

module.exports = {
  generateGitignoreContent,
  setupGitignore,
};
