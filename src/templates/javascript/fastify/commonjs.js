// Minimal Fastify CommonJS Template

module.exports = `
require("dotenv").config();

const Fastify = require("fastify");
const cors = require("@fastify/cors");

// Create Fastify instance (no logger)
const fastify = Fastify({ logger: false });

// Register CORS
fastify.register(cors);

// Home route
fastify.get("/", async (_req, _reply) => {
  return "Fogoe running";
});

// Start server
const PORT = process.env.PORT || 3000;

fastify.listen({ port: PORT, host: "0.0.0.0" })
  .then(() => {
    console.log(\`Server running on http://localhost:\${PORT}\`);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
`.trim();
