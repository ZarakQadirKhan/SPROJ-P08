const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
require("dotenv").config();

process.on("uncaughtException", (err) => {
  console.error("uncaughtException:", err);
});
process.on("unhandledRejection", (err) => {
  console.error("unhandledRejection:", err);
});

console.log("Booting backend…");

const app = express();
app.use(cors());
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({ ok: true, mongo: mongoose.connection.readyState === 1 ? "connected" : "not_connected" });
});

const port = process.env.PORT ? Number(process.env.PORT) : 5000;
app.listen(port, () => {
  console.log("✔ Server listening on", port);
  connect_mongo();
});

async function connect_mongo() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("✖ MONGODB_URI missing — server will run without DB. Set it in Render → Environment.");
    return;
  }
  try {
    console.log("Connecting to Mongo…");
    await mongoose.connect(uri);
    console.log("✔ Mongo connected");
  } catch (err) {
    console.error("✖ Mongo connection failed:", err && err.message ? err.message : err);
    // Keep server alive so you can see logs & health; fix env/Atlas and redeploy
  }
}
