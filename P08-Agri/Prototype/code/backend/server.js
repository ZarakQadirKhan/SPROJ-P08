// server.js
const express = require('express');
const cors = require('cors');

const app = express();

/* ---------- Allowed origins ---------- */
const LOCAL_ORIGIN = 'http://localhost:3000';
const PROD_ORIGIN = 'https://sproj-p08-silk.vercel.app';
const VERCEL_PREVIEW_RE = /^https:\/\/[\w-]+\.vercel\.app$/;

function is_allowed_origin(origin) {
  if (!origin) return true;
  if (origin === LOCAL_ORIGIN) return true;
  if (origin === PROD_ORIGIN) return true;
  if (VERCEL_PREVIEW_RE.test(origin)) return true;
  return false;
}

/* ---------- CORS (must be before routes) ---------- */
const cors_options = {
  origin(origin, cb) {
    if (is_allowed_origin(origin)) return cb(null, true);
    return cb(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 204
};
app.use(cors(cors_options));
app.options('*', cors(cors_options));

/* ---------- Body parsers ---------- */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* ---------- Small helpers ---------- */
function s(v) {
  if (v === undefined || v === null) return '';
  return String(v).trim();
}

/* ---------- Health ---------- */
app.get('/health', (req, res) => res.json({ ok: true }));
app.get('/api/health', (req, res) => res.json({ ok: true }));

/* ---------- Debug echo (useful to verify what server receives) ---------- */
app.post('/api/echo', (req, res) => {
  res.json({ received_headers: req.headers, body: req.body });
});

/* ---------- Auth routes (demo stubs) ---------- */
app.post('/api/auth/register', (req, res) => {
  console.log('REGISTER body:', req.body);

  const full_name = s(req.body.full_name || req.body.name);
  const email = s(req.body.email);
  const phone = s(req.body.phone);
  const role = s(req.body.role);
  const password = s(req.body.password);

  if (!full_name || !email || !password || !role) {
    return res.status(400).json({ error: 'Missing fields' });
  }

  const user = { id: 'u_' + Date.now(), full_name, email, phone, role };
  const token = 'stub_token';

  return res.status(201).json({ ok: true, user, token });
});

app.post('/api/auth/login', (req, res) => {
  console.log('LOGIN body:', req.body);

  const email = s(req.body.email);
  const password = s(req.body.password);

  if (!email || !password) {
    return res.status(400).json({ error: 'Missing credentials' });
  }

  const user = { id: 'u_' + Date.now(), email, role: 'farmer' };
  const token = 'stub_token';

  return res.status(200).json({ ok: true, user, token });
});

/* ---------- CORS error handler ---------- */
app.use((err, req, res, next) => {
  if (err && err.message === 'Not allowed by CORS') {
    return res.status(403).json({ error: 'CORS blocked: origin not allowed' });
  }
  next(err);
});

/* ---------- Start ---------- */
const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log('API listening on', port);
});
