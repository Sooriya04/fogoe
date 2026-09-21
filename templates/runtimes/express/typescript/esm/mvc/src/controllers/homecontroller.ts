import { Request, Response } from "express";

export function home(_req: Request, res: Response): void {
  res.send("Fogoe running");
}
