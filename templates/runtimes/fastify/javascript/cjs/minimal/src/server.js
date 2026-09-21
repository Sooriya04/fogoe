require("dotenv").config();
const Fastify = require("fastify");
const cors = require("@fastify/cors");

const fastify = Fastify({ logger: false });
fastify.register(cors);

fastify.get("/", async (_req, _reply) => {
  return "Fogoe running";
});

const PORT = Number(process.env.PORT) || 3000;
fastify.listen({ port: PORT, host: "0.0.0.0" })
  .then(() => {
    console.log(`Server running on http://localhost:${PORT}`);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
