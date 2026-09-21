import express, { Router } from "express";
import { home } from "../controllers/homecontroller.js";

const router: Router = express.Router();

router.get("/", home);

export default router;
