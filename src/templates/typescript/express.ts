import express, { Request, Response } from "express";

const app = express();

app.get("/", (_: Request, res: Response) => {
  res.send("Fogoe is running");
});

app.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});
