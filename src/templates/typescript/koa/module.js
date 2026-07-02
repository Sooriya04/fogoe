module.exports = `
import "dotenv/config";
import Koa from "koa";
import Router from "@koa/router";
import cors from "@koa/cors";
import { bodyParser } from "@koa/bodyparser";

const app = new Koa();
const router = new Router();

app.use(cors());
app.use(bodyParser());

router.get("/", (ctx) => {
  ctx.body = "Fogoe running";
});

app.use(router.routes()).use(router.allowedMethods());

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(\`Server running on http://localhost:\${PORT}\`);
});
`.trim();
