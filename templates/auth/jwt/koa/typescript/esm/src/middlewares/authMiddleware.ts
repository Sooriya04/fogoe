import { Context, Next } from "koa";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../config/env.js";

export async function authMiddleware(ctx: Context, next: Next): Promise<void> {
  const authHeader = ctx.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    ctx.status = 401;
    ctx.body = { error: "Access token required" };
    return;
  }

  try {
    ctx.state.user = jwt.verify(token, JWT_SECRET);
    await next();
  } catch (err) {
    ctx.status = 403;
    ctx.body = { error: "Invalid or expired token" };
  }
}

export { jwt };
export default authMiddleware;
