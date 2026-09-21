import { Hono } from "hono";
import { home } from "../controllers/homecontroller";

const router = new Hono();
router.get("/", home);

export = router;
