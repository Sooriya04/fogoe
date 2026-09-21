import "dotenv/config";
import app from "./app.js";
import { PORT } from "./config/env.js";

app.listen(PORT, (): void => {
  console.log(`Server running on http://localhost:${PORT}`);
});
