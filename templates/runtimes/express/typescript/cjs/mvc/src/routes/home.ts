import express, { Router } from "express";
import { home } from "../controllers/homecontroller";

const router: Router = express.Router();

router.get("/", home);

export = router;
