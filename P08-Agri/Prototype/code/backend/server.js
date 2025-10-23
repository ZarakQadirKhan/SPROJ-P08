const express = require("express");
const cors = require("cors");

const app = express();

const allowed_origins = [
  "http://localhost:3000",
  "https://sproj-p08-silk.vercel.app"
];

app.use(cors({
  origin(origin, cb) {
    if (!origin) return cb(null, true);
    if (allowed_origins.includes(origin)) return cb(null, true);
    return cb(new Error("Not allowed by CORS"));
  },
  credentials: true
}));

app.use(express.json());

app.post("/api/auth/register", (req, res) => {
  const { full_name, email, phone, role, password } = req.body;
  if (!full_name || !email || !password || !role) {
    return res.status(400).json({ error: "Missing fields" });
  }
  return res.status(201).json({ ok: true });
});

const port = process.env.PORT || 5000;
app.listen(port);
