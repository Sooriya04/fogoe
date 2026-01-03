module.exports = 
`const fastify = require("fastify")();

fastify.get("/", async (_request, reply) => {
  reply.send("Fogoe is running");
});

fastify.listen({ port: 3000 }, (err) => {
  if (err) {
    fastify.log.error(err);
    process.exit(1);
  }
  console.log("Server running on http://localhost:3000");
});`.trim()
