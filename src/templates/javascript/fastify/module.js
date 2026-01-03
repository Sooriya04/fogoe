// Minimal Fastify ES Module Template

module.exports = `
import "dotenv/config";

import Fastify from "fastify";
import cors from "@fastify/cors";

// Create Fastify instance (no logger)
const fastify = Fastify({ logger: false });

// Register CORS
await fastify.register(cors);

// Home route
fastify.get("/", async () => {
  return "Fogoe running";
});

// Start server
const PORT = process.env.PORT || 3000;

try {
  await fastify.listen({ port: PORT, host: "0.0.0.0" });
  console.log(\`Server running on http://localhost:\${PORT}\`);
} catch (err) {
  console.error(err);
  process.exit(1);
}
`.trim();
