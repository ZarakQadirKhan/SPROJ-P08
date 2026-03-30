const axios = require('axios')
const mongoose = require('mongoose')
const User = require('./models/User')
const { send_weather_alert_email } = require('./email_service')

const WEATHER_API_URL = 'https://api.open-meteo.com/v1/forecast'
const RUNNER_INTERVAL_MS = Number.parseInt(process.env.WEATHER_ALERT_RUNNER_MS || String(15 * 60 * 1000), 10)
const EMAIL_INTERVAL_MS = Number.parseInt(process.env.WEATHER_ALERT_EMAIL_MS || String(5 * 60 * 1000), 10)

let runner = null
let in_flight = false

function weathercode_to_condition(code) {
  if (code == null) return 'Unknown'
  const c = Number(code)
  if (c === 0) return 'Clear'
  if (c >= 1 && c <= 3) return ['Mainly clear', 'Partly cloudy', 'Overcast'][c - 1]
  if (c >= 45 && c <= 48) return 'Fog'
  if (c >= 51 && c <= 57) return 'Drizzle'
  if (c >= 61 && c <= 67) return 'Rain'
  if (c >= 71 && c <= 77) return 'Snow'
  if (c >= 80 && c <= 82) return 'Rain showers'
  if (c >= 85 && c <= 86) return 'Snow showers'
  if (c >= 95 && c <= 99) return 'Thunderstorm'
  return 'Unknown'
}

function build_email_summary(current, today) {
  const wind = Math.round(Number(current.wind_speed_kmh || 0))
  const rain = Number(today.precipitation_mm || 0).toFixed(1)
  const uv = Number(today.uv_index_max || 0).toFixed(1)
  const parts = [
    `Condition: ${current.condition || 'Unknown'}.`,
    `Temp: ${Number(current.temperature_c || 0).toFixed(1)}C.`,
    `Rain today: ${rain} mm.`,
    `Wind: ${wind} km/h.`,
    `UV max: ${uv}.`
  ]

  const actions = []
  if (Number(today.precipitation_mm || 0) >= 10) actions.push('Rain likely: avoid extra irrigation and check drainage.')
  if (Number(current.wind_speed_kmh || 0) >= 25 || Number(today.wind_gust_max_kmh || 0) >= 35) actions.push('Wind is high: avoid spraying to reduce drift risk.')
  if (Number(today.uv_index_max || 0) >= 8) actions.push('Strong UV expected: limit heavy midday work and hydrate.')
  if (actions.length === 0) actions.push('No severe trigger right now; continue routine crop monitoring.')

  return {
    summary: parts.join(' '),
    details: actions.join(' ')
  }
}

async function fetch_weather(latitude, longitude) {
  const params = {
    latitude,
    longitude,
    daily: ['temperature_2m_max', 'temperature_2m_min', 'precipitation_sum', 'uv_index_max', 'wind_gusts_10m_max'].join(','),
    current_weather: true,
    timezone: 'auto'
  }
  const api_response = await axios.get(WEATHER_API_URL, { params, timeout: 10000 })
  const data = api_response?.data || {}
  const weathercode = data.current_weather?.weathercode ?? data.current?.weather_code
  const current = {
    temperature_c: data.current_weather?.temperature || data.current?.temperature_2m,
    wind_speed_kmh: data.current_weather?.windspeed || data.current?.wind_speed_10m,
    condition: weathercode_to_condition(weathercode)
  }
  const today = {
    precipitation_mm: data.daily?.precipitation_sum?.[0],
    uv_index_max: data.daily?.uv_index_max?.[0],
    wind_gust_max_kmh: data.daily?.wind_gusts_10m_max?.[0]
  }
  return {
    city: data.timezone || 'Your location',
    current,
    today
  }
}

function is_due(user, now) {
  const last = user.weather_alert_last_sent_at ? new Date(user.weather_alert_last_sent_at).getTime() : null
  if (last && now - last >= EMAIL_INTERVAL_MS) return true
  if (last) return false
  const created = user.createdAt ? new Date(user.createdAt).getTime() : null
  if (!created) return true
  return now - created >= EMAIL_INTERVAL_MS
}

async function run_weather_email_cycle() {
  if (in_flight) return
  if (mongoose.connection.readyState !== 1) return
  in_flight = true
  try {
    const now = Date.now()
    const farmers = await User.find({
      role: 'farmer',
      email_verified: true,
      weather_alert_lat: { $ne: null },
      weather_alert_lon: { $ne: null }
    }).select('_id email createdAt weather_alert_lat weather_alert_lon weather_alert_last_sent_at')

    for (const farmer of farmers) {
      if (!is_due(farmer, now)) continue
      try {
        const latitude = Number(farmer.weather_alert_lat)
        const longitude = Number(farmer.weather_alert_lon)
        if (Number.isNaN(latitude) || Number.isNaN(longitude)) continue
        const weather = await fetch_weather(latitude, longitude)
        const { summary, details } = build_email_summary(weather.current, weather.today)
        await send_weather_alert_email({
          recipient_email: farmer.email,
          location_label: weather.city,
          summary,
          details
        })
        farmer.weather_alert_last_sent_at = new Date()
        await farmer.save()
      } catch (error) {
        console.error('[WeatherEmail] Failed for user', farmer._id?.toString(), error?.message || error)
      }
    }
  } catch (error) {
    console.error('[WeatherEmail] Cycle error:', error?.message || error)
  } finally {
    in_flight = false
  }
}

function start_weather_email_alerts() {
  const enabled = String(process.env.WEATHER_ALERT_EMAILS_ENABLED || 'true').toLowerCase() !== 'false'
  if (!enabled) {
    console.log('[WeatherEmail] Disabled by WEATHER_ALERT_EMAILS_ENABLED=false')
    return
  }
  if (runner) return
  runner = setInterval(run_weather_email_cycle, RUNNER_INTERVAL_MS)
  run_weather_email_cycle().catch(() => {})
  console.log('[WeatherEmail] Scheduler started:', { runner_interval_ms: RUNNER_INTERVAL_MS, email_interval_ms: EMAIL_INTERVAL_MS })
}

module.exports = {
  start_weather_email_alerts
}
