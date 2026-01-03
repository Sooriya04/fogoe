const fs = require("fs");

const templates = {
  express: require("./templates/javascript/express"),
  fastify: require("./templates/javascript/fastify")
};

function scaffold(runtime) {
  fs.mkdirSync("src", { recursive: true });
  fs.writeFileSync("src/server.js", templates[runtime]);
}

module.exports = { scaffold };
