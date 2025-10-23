// src/services/weatherService.js

// Resolve your backend base URL (works for CRA or Vite)
const fromEnv =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_BASE_URL) ||
  process.env.REACT_APP_API_BASE_URL;

const API_BASE =
  fromEnv ||
  (window.location.hostname === 'localhost'
    ? 'http://localhost:5000'
    : 'https://sproj-p08.onrender.com'); 

export async function fetch_weather_by_coords(latitude, longitude) {
  const url = `${API_BASE}/api/weather?lat=${encodeURIComponent(
    latitude
  )}&lon=${encodeURIComponent(longitude)}`;

  const res = await fetch(url, { headers: { 'Content-Type': 'application/json' } });

  let data = null;
  try {
    data = await res.json();
  } catch {
    // keep data as null
  }

  if (!res.ok) {
    const msg =
      (data && (data.message || data.error || data.detail)) ||
      `Weather request failed (${res.status})`;
    throw new Error(msg);
  }

  // Normalize field name so your Dashboard's advice keeps working
  if (data?.today && data.today.wind_gust_max_kmh !== undefined && data.today.wind_gusts_kmh === undefined) {
    data.today.wind_gusts_kmh = data.today.wind_gust_max_kmh;
  }

  return data; // { city, latitude, longitude, current:{...}, today:{...}, advice:[...] }
}
