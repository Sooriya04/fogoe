import { Context } from "hono";

export function home(c: Context) {
  return c.text("Fogoe running");
}
