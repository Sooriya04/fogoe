import { Hono } from "hono";
import { cors } from "hono/cors";
import homeRoutes from "./routes/home";

const app = new Hono();

app.use("*", cors());
app.route("/", homeRoutes);

export = app;
