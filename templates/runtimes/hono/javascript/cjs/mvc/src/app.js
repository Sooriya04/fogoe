const { Hono } = require("hono");
const { cors } = require("hono/cors");
const homeRoutes = require("./routes/home");

const app = new Hono();

app.use("*", cors());
app.route("/", homeRoutes);

module.exports = app;
