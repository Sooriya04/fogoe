import Fastify, { FastifyInstance } from "fastify";

const fastify: FastifyInstance = Fastify();

fastify.get("/", async () => {
  return "Fogoe is running";
});

const start = async (): Promise<void> => {
  try {
    await fastify.listen({ port: 3000 });
    console.log("Server running on http://localhost:3000");
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
