const jwt = require("jsonwebtoken");
const { JWT_SECRET } = require("../config/env");

async function authMiddleware(c, next) {
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

module.exports = { authMiddleware, jwt };
