import { home } from "../controllers/homecontroller.js";

export default async function homeRoutes(fastify, _options) {
  fastify.get("/", home);
}
