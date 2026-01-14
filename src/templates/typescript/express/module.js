// Minimal Express ES Module TypeScript Template
module.exports = `import "dotenv/config";

import express, { Request, Response, Application } from "express";
import cors from "cors";

const app: Application = express();

app.use(cors());
app.use(express.json());

app.get("/", (_req: Request, res: Response): void => {
  res.send("Fogoe running");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, (): void => {
  console.log(\`Server running on http://localhost:\${PORT}\`);
});
`.trim();
