// server.js (CommonJS)
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
require("dotenv").config();

process.on("uncaughtException", (err) => {
  console.error("uncaughtException:", err);
  process.exit(1);
});
process.on("unhandledRejection", (err) => {
  console.error("unhandledRejection:", err);
  process.exit(1);
});

console.log("Booting backend…");

const app = express();
app.use(cors());
app.use(express.json());

app.get("/api/health", (req, res) => res.json({ ok: true }));

async function start() {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error("MONGODB_URI missing");
    }
    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET missing");
    }

    console.log("Connecting to Mongo…");
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✔ Mongo connected");

    const port = process.env.PORT ? Number(process.env.PORT) : 5000;
    app.listen(port, () => console.log("✔ Server listening on", port));
  } catch (err) {
    console.error("Startup error:", err);
    process.exit(1);
  }
}
start();
