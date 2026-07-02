module.exports = `
require("dotenv").config();
const { Hono } = require("hono");
const { serve } = require("@hono/node-server");
const { cors } = require("hono/cors");

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
