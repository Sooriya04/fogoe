module.exports = `
import "dotenv/config";
import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { cors } from "hono/cors";

const app = new Hono();

app.use("*", cors());

app.get("/", (c) => c.text("Fogoe running"));

const PORT = Number(process.env.PORT) || 3000;
console.log(\`Server running on http://localhost:\${PORT}\`);

serve({
  fetch: app.fetch,
  port: PORT
});
`.trim();
