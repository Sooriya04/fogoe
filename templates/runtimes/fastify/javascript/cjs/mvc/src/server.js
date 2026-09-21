require("dotenv").config();
const app = require("./app");
const { PORT } = require("./config/env");

app.listen({ port: PORT, host: "0.0.0.0" })
  .then(() => {
    console.log(`Server running on http://localhost:${PORT}`);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
