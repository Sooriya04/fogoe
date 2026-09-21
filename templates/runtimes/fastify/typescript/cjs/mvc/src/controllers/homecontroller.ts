import { FastifyRequest, FastifyReply } from "fastify";

export async function home(_req: FastifyRequest, reply: FastifyReply): Promise<void> {
  reply.type("text/plain").send("Fogoe running");
}
