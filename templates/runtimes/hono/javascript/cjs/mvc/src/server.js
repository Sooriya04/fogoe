require("dotenv").config();
const app = require("./app");
const { serve } = require("@hono/node-server");
const { PORT } = require("./config/env");

console.log(`Server running on http://localhost:${PORT}`);

serve({
  fetch: app.fetch,
  port: PORT
});
