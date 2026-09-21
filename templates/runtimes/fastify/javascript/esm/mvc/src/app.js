import Fastify from "fastify";
import cors from "@fastify/cors";
import homeRoutes from "./routes/home.js";

const fastify = Fastify();

fastify.register(cors);
fastify.register(homeRoutes);

export default fastify;
