import "dotenv/config";
import app from "./app.js";
import { serve } from "@hono/node-server";
import { PORT } from "./config/env.js";

console.log(`Server running on http://localhost:${PORT}`);

serve({
  fetch: app.fetch,
  port: PORT
});
