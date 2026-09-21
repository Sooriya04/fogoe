import "dotenv/config";
import app from "./app";
import { serve } from "@hono/node-server";
import { PORT } from "./config/env";

console.log(`Server running on http://localhost:${PORT}`);

serve({
  fetch: app.fetch,
  port: PORT
});
