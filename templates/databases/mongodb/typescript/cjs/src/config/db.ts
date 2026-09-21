import mongoose from "mongoose";
import { DATABASE_URL } from "./env";

mongoose.connect(DATABASE_URL)
  .then((): void => console.log("MongoDB connected"))
  .catch((err): void => console.error("MongoDB error:", err));

export = mongoose;
