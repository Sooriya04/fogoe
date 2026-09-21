async function home(_req, reply) {
  reply.type("text/plain").send("Fogoe running");
}

module.exports = { home };
