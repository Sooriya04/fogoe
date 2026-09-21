import { FastifyInstance } from "fastify";
import { home } from "../controllers/homecontroller";

async function homeRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.get("/", home);
}

export = homeRoutes;
