import "dotenv/config";
import app from "./app.js";
import { PORT } from "./config/env.js";

app.listen({ port: PORT, host: "0.0.0.0" })
  .then((): void => {
    console.log(`Server running on http://localhost:${PORT}`);
  })
  .catch((err): void => {
    console.error(err);
    process.exit(1);
  });
