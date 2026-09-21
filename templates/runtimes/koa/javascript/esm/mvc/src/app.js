import Koa from "koa";
import cors from "@koa/cors";
import { bodyParser } from "@koa/bodyparser";
import homeRoutes from "./routes/home.js";

const app = new Koa();

app.use(cors());
app.use(bodyParser());
app.use(homeRoutes.routes()).use(homeRoutes.allowedMethods());

export default app;
