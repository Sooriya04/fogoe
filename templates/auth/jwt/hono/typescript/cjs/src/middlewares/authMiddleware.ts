import { Context, Next } from "hono";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../config/env";

export async function authMiddleware(c: Context, next: Next): Promise<Response | void> {
  const authHeader = c.req.header("authorization");
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return c.json({ error: "Access token required" }, 401);
  }

  try {
    c.set("user", jwt.verify(token, JWT_SECRET));
    await next();
  } catch (err) {
    return c.json({ error: "Invalid or expired token" }, 403);
  }
}

export = { authMiddleware, jwt };
