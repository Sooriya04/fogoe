import Fastify, { FastifyInstance } from "fastify";
import cors from "@fastify/cors";
import homeRoutes from "./routes/home";

const fastify: FastifyInstance = Fastify();

fastify.register(cors);
fastify.register(homeRoutes);

export = fastify;
