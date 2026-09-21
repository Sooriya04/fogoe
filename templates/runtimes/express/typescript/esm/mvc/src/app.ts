import express, { Application } from "express";
import cors from "cors";
import homeRoutes from "./routes/home.js";

const app: Application = express();

app.use(cors());
app.use(express.json());
app.use("/", homeRoutes);

export default app;
