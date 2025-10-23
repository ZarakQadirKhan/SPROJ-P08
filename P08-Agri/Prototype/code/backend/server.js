const express = require("express");
const cors = require("cors");

const app = express();

const LOCAL_ORIGIN = "http://localhost:3000";
const PROD_ORIGIN = "https://sproj-p08-silk.vercel.app";
const PREVIEW_REGEX = /^https:\/\/sproj-p08-[a-z0-9-]+\.vercel\.app$/;

function is_allowed_origin(origin) {
  if (!origin) {
    return true;
  }
  if (origin === LOCAL_ORIGIN) {
    return true;
  }
  if (origin === PROD_ORIGIN) {
    return true;
  }
  if (PREVIEW_REGEX.test(origin)) {
    return true;
  }
  return false;
}

const cors_options = {
  origin(origin, cb) {
    if (is_allowed_origin(origin)) {
      return cb(null, true);
    }
    return cb(new Error("Not allowed by CORS"));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
};

app.use(cors(cors_options));
app.options("*", cors(cors_options));

app.use(express.json());

app.get("/health", (req, res) => {
  res.json({ ok: true });
});

app.post("/api/auth/register", (req, res) => {
  const { full_name, email, phone, role, password } = req.body;
  if (!full_name || !email || !password || !role) {
    return res.status(400).json({ error: "Missing fields" });
  }
  return res.status(201).json({ ok: true, user: { role } });
});

app.post("/api/auth/login", (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Missing credentials" });
  }
  return res.status(200).json({ ok: true, user: { role: "farmer" } });
});

app.use((err, req, res, next) => {
  if (err && err.message === "Not allowed by CORS") {
    return res.status(403).json({ error: "CORS blocked: origin not allowed" });
  }
  return next(err);
});

const port = process.env.PORT || 5000;
app.listen(port);
