// Minimal Fastify ES Module TypeScript Template
module.exports = `import "dotenv/config";

import Fastify, { FastifyInstance } from "fastify";
import cors from "@fastify/cors";

const fastify: FastifyInstance = Fastify({ logger: false });

await fastify.register(cors);

fastify.get("/", async () => {
  return "Fogoe running";
});

const PORT = Number(process.env.PORT) || 3000;

try {
  await fastify.listen({ port: PORT, host: "0.0.0.0" });
  console.log(\`Server running on http://localhost:\${PORT}\`);
} catch (err) {
  console.error(err);
  process.exit(1);
}
`.trim();
