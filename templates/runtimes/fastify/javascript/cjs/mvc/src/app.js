const Fastify = require("fastify");
const cors = require("@fastify/cors");
const homeRoutes = require("./routes/home");

const fastify = Fastify();

fastify.register(cors);
fastify.register(homeRoutes);

module.exports = fastify;
