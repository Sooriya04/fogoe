const { execSync } = require("child_process");

function install(runtime) {
  execSync(
    `npm install ${runtime} && npm install -D nodemon`,
    { stdio: "inherit" }
  );
}

module.exports = { install };
