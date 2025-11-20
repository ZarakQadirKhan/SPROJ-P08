require('dotenv').config()
const express = require('express')
const cors = require('cors')
const fs = require('fs')
const path = require('path')

const app = express()

const LOCAL_ORIGIN = 'http://localhost:3000'
const PROD_ORIGIN = 'https://sproj-p08-silk.vercel.app'
const VERCEL_PREVIEW_RE = /^https:\/\/[\w-]+\.vercel\.app$/

function is_allowed_origin(origin) {
  if (!origin) {
    return true
  }

  if (origin === LOCAL_ORIGIN) {
    return true
  }

  if (origin === PROD_ORIGIN) {
    return true
  }

  const is_vercel_preview = VERCEL_PREVIEW_RE.test(origin)
  if (is_vercel_preview === true) {
    return true
  }

  const is_string_origin = typeof origin === 'string'
  if (is_string_origin === true && origin.includes('.vercel.app')) {
    return true
  }

  return false
}

const cors_options = {
  origin(origin, callback) {
    if (is_allowed_origin(origin) === true) {
      callback(null, true)
      return
    }

    const cors_error = new Error('Not allowed by CORS')
    callback(cors_error)
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 204
}

app.use(cors(cors_options))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.get('/health', function (request, response) {
  const payload = { ok: true, cwd: process.cwd() }
  response.json(payload)
})

app.get('/api/health', function (request, response) {
  const payload = { ok: true }
  response.json(payload)
})

const auth_router = require(path.resolve(__dirname, 'routes', 'auth.js'))
app.use('/api/auth', auth_router)

const weather_router_path = path.resolve(__dirname, 'routes', 'weather.js')
const weather_exists = fs.existsSync(weather_router_path)
let weather_mounted = false

try {
  if (weather_exists === true) {
    const weather_router = require(weather_router_path)
    app.use('/api/weather', weather_router)
    weather_mounted = true
  }
} catch (error) {}

if (weather_mounted === false) {
  app.get('/api/weather', function (request, response) {
    const payload = { ok: false, message: 'Weather router not mounted' }
    response.status(501).json(payload)
  })
}

const diagnose_router_path = path.resolve(__dirname, 'routes', 'diagnose.js')
let diagnose_mounted = false

try {
  const diagnose_exists = fs.existsSync(diagnose_router_path)
  if (diagnose_exists === true) {
    const diagnose_router = require(diagnose_router_path)
    app.use('/api/diagnose', diagnose_router)
    diagnose_mounted = true
    console.log('Diagnose router mounted successfully')
  } else {
    console.warn('Diagnose router file not found:', diagnose_router_path)
  }
} catch (error) {
  const error_message = error.message || error
  console.error('Failed to mount diagnose router:', error_message)
  console.error('Stack:', error.stack)
}

if (diagnose_mounted === false) {
  app.post('/api/diagnose', function (request, response) {
    const payload = {
      ok: false,
      message: 'Diagnose router not mounted',
      detail: 'The diagnose router failed to load. Check backend logs and ensure all dependencies (multer, form-data) are installed.'
    }
    response.status(501).json(payload)
  })
}

app.use(function (error, request, response, next) {
  const is_cors_error = error && error.message === 'Not allowed by CORS'
  if (is_cors_error === true) {
    const payload = { error: 'CORS blocked: origin not allowed' }
    response.status(403).json(payload)
    return
  }

  next(error)
})

const port = process.env.PORT || 5000
app.listen(port, function () {})
