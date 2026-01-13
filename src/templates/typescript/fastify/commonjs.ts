// Minimal Fastify CommonJS TypeScript Template
export default `
import "dotenv/config";

import Fastify, { FastifyInstance } from "fastify";
import cors from "@fastify/cors";

const fastify: FastifyInstance = Fastify({ logger: false });

fastify.register(cors);

fastify.get("/", async () => {
  return "Fogoe running";
});

const PORT = Number(process.env.PORT) || 3000;

fastify.listen({ port: PORT, host: "0.0.0.0" })
  .then((): void => {
    console.log(\`Server running on http://localhost:\${PORT}\`);
  })
  .catch((err): void => {
    console.error(err);
    process.exit(1);
  });
`.trim();
