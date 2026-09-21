const jwt = require("jsonwebtoken");
const { JWT_SECRET } = require("../config/env");

async function authMiddleware(req, reply) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return reply.code(401).send({ error: "Access token required" });
  }

  try {
    req.user = jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return reply.code(403).send({ error: "Invalid or expired token" });
  }
}

module.exports = { authMiddleware, jwt };
