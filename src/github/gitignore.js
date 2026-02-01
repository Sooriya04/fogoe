const fs = require('fs');

const DEFAULT_GITIGNORE = 'node_modules/\n.env';

/**
 * Creates or updates .gitignore file with essential entries
 */
function setupGitignore() {
  const gitignorePath = '.gitignore';

  if (!fs.existsSync(gitignorePath)) {
    try {
      fs.writeFileSync(gitignorePath, DEFAULT_GITIGNORE);
      console.log('.gitignore configured successfully.');
    } catch (err) {
      console.error('Failed to create or update .gitignore file.');
      process.exit(1);
    }
  } else {
    const currentContent = fs.readFileSync(gitignorePath, 'utf8');

    let toAppend = '';
    if (!currentContent.includes('node_modules/'))
      toAppend += '\nnode_modules/';
    if (!currentContent.includes('.env')) toAppend += '\n.env';

    if (toAppend) {
      try {
        fs.appendFileSync(gitignorePath, toAppend);
      } catch (err) {
        console.error('Failed to create or update .gitignore file.');
        process.exit(1);
      }
    }
  }
}

module.exports = { setupGitignore };
