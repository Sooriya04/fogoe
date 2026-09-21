import { Hono } from "hono";
import { home } from "../controllers/homecontroller.js";

const router = new Hono();
router.get("/", home);

export default router;
