import { FastifyInstance } from "fastify";
import { home } from "../controllers/homecontroller.js";

export default async function homeRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.get("/", home);
}
