import Router from "@koa/router";
import { home } from "../controllers/homecontroller";

const router = new Router();
router.get("/", home);

export = router;
