import { Hono } from "hono";
import { cors } from "hono/cors";
import homeRoutes from "./routes/home.js";

const app = new Hono();

app.use("*", cors());
app.route("/", homeRoutes);

export default app;
