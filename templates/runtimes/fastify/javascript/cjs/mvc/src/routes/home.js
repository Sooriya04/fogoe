const homeController = require("../controllers/homecontroller");

async function homeRoutes(fastify, _options) {
  fastify.get("/", homeController.home);
}

module.exports = homeRoutes;
