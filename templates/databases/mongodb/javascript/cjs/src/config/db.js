const mongoose = require("mongoose");
const { DATABASE_URL } = require("./env");

mongoose.connect(DATABASE_URL)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB error:", err));

module.exports = mongoose;
