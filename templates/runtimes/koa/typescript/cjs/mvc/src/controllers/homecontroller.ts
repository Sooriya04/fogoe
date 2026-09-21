import { Context } from "koa";

export function home(ctx: Context): void {
  ctx.body = "Fogoe running";
}
