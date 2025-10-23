const express = require("express");
const app = express();

app.get("/api/health", (req, res) => res.json({ ok: true }));

const port = process.env.PORT ? Number(process.env.PORT) : 5000;
app.listen(port, () => {
  console.log("BOOT_OK on", port);
});
