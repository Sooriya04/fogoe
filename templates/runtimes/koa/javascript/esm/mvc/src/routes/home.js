import Router from "@koa/router";
import { home } from "../controllers/homecontroller.js";

const router = new Router();
router.get("/", home);

export default router;
