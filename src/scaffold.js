const { composeProject } = require('./composer');

/**
 * Main scaffold function
 * Delegates to the template-based composeProject engine.
 */
function scaffold(
  language,
  runtime,
  type,
  architecture,
  database = "none",
  hashing = "bcrypt",
  useJwt = false,
  testing = false,
  linting = false,
  targetDir = process.cwd()
) {
  return composeProject({
    targetDir,
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
}

module.exports = { scaffold, composeProject };
