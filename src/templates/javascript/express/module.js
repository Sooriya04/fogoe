// Minimal Express ES Module Template
module.exports = `
// Load environment variables
import "dotenv/config";

import express from "express";
import cors from "cors";

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Home route
app.get("/", (req, res) => res.send("Fogoe running"));

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(\`Server running on http://localhost:\${PORT}\`);
});
`.trim();
