const Koa = require("koa");
const cors = require("@koa/cors");
const { bodyParser } = require("@koa/bodyparser");
const homeRoutes = require("./routes/home");

const app = new Koa();

app.use(cors());
app.use(bodyParser());
app.use(homeRoutes.routes()).use(homeRoutes.allowedMethods());

module.exports = app;
