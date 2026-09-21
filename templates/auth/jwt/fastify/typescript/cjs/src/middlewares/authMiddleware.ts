import { FastifyRequest, FastifyReply } from "fastify";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../config/env";

export async function authMiddleware(req: FastifyRequest, reply: FastifyReply): Promise<void> {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    reply.code(401).send({ error: "Access token required" });
    return;
  }

  try {
    (req as any).user = jwt.verify(token, JWT_SECRET);
  } catch (err) {
    reply.code(403).send({ error: "Invalid or expired token" });
  }
}

export = { authMiddleware, jwt };
