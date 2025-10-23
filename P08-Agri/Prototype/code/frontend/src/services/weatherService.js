// src/services/weatherService.js

function build_url(lat, lon) {
  const url = new URL('https://api.open-meteo.com/v1/forecast');
  url.searchParams.set('latitude', lat);
  url.searchParams.set('longitude', lon);
  url.searchParams.set('timezone', 'auto');
  url.searchParams.set('forecast_days', '1');
  url.searchParams.set('current', 'temperature_2m,wind_speed_10m');
  url.searchParams.set('daily', 'temperature_2m_max,temperature_2m_min,precipitation_sum,uv_index_max,wind_gusts_10m_max');
  return url.toString();
}

async function reverse_geocode(lat, lon) {
  try {
    const url = new URL('https://geocoding-api.open-meteo.com/v1/reverse');
    url.searchParams.set('latitude', lat);
    url.searchParams.set('longitude', lon);
    url.searchParams.set('language', 'en');
    url.searchParams.set('format', 'json');
    const res = await fetch(url.toString());
    const data = await res.json();
    const top = data?.results?.[0];
    if (!top) return null;
    // Try to assemble a nice label
    const parts = [top.name, top.admin1, top.country].filter(Boolean);
    return parts.join(', ');
  } catch {
    return null;
  }
}

function generate_advice(today, current) {
  const tips = [];
  const rain = today.precipitation_mm;
  const tmax = today.tmax_c;
  const tmin = today.tmin_c;
  const uv = today.uv_index_max;
  const wind_now = current.wind_speed_kmh;
  const gust = today.wind_gusts_kmh;

  if (rain >= 2) {
    tips.push('Rain expected: postpone irrigation and nitrogen top-dress; check for waterlogging in low fields.');
  } else {
    tips.push('No significant rain: if soil is dry, irrigate early morning or late evening.');
  }

  if (wind_now >= 25 || gust >= 40) {
    tips.push('Windy: avoid pesticide/herbicide spraying; secure mulches/covers.');
  } else {
    tips.push('Calm enough for spraying if needed.');
  }

  if (tmax >= 35) {
    tips.push('Heat stress likely: irrigate lightly, avoid midday field work, consider shade for seedlings.');
  } else if (tmin <= 5) {
    tips.push('Possible cold stress: consider light irrigation before dawn and protect young plants.');
  }

  if (uv >= 8) {
    tips.push('High UV: schedule outdoor work for morning/evening and use sun protection.');
  }

  return tips;
}

export async function fetch_weather_by_coords(latitude, longitude) {
  const [wxRes, cityName] = await Promise.all([
    fetch(build_url(latitude, longitude)),
    reverse_geocode(latitude, longitude)
  ]);

  let wx;
  try {
    wx = await wxRes.json();
  } catch {
    throw new Error('Weather service returned invalid JSON');
  }
  if (!wxRes.ok) {
    const reason = wx?.error || wx?.reason || `Weather request failed (${wxRes.status})`;
    throw new Error(reason);
  }

  const current = {
    temperature_c: wx?.current?.temperature_2m ?? null,
    wind_speed_kmh: wx?.current?.wind_speed_10m ?? null
  };

  const today = {
    tmax_c: wx?.daily?.temperature_2m_max?.[0] ?? null,
    tmin_c: wx?.daily?.temperature_2m_min?.[0] ?? null,
    precipitation_mm: wx?.daily?.precipitation_sum?.[0] ?? 0,
    uv_index_max: wx?.daily?.uv_index_max?.[0] ?? null,
    wind_gusts_kmh: wx?.daily?.wind_gusts_10m_max?.[0] ?? null
  };

  const advice = generate_advice(today, current);

  return {
    city: cityName || 'Your location',
    current,
    today,
    advice
  };
}
