import "dotenv/config";
import app from "./app";
import { PORT } from "./config/env";

app.listen(PORT, (): void => {
  console.log(`Server running on http://localhost:${PORT}`);
});
