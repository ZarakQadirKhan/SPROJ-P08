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
    const u = new URL('https://geocoding-api.open-meteo.com/v1/reverse');
    u.searchParams.set('latitude', lat);
    u.searchParams.set('longitude', lon);
    u.searchParams.set('language', 'en');
    const r = await fetch(u.toString());
    const j = await r.json();
    const top = j?.results?.[0];
    if (!top) return null;
    const parts = [top.name, top.admin1, top.country].filter(Boolean);
    return parts.join(', ');
  } catch {
    return null;
  }
}

function generate_advice(today, current) {
  const tips = [];
  if ((today.precipitation_mm ?? 0) >= 2) {
    tips.push('Rain expected: postpone irrigation and nitrogen top-dress; check for waterlogging.');
  } else {
    tips.push('No significant rain: irrigate early morning or late evening if soil is dry.');
  }
  if ((current.wind_speed_kmh ?? 0) >= 25 || (today.wind_gusts_kmh ?? 0) >= 40) {
    tips.push('Windy: avoid spraying; secure mulches/covers.');
  }
  if ((today.tmax_c ?? 0) >= 35) {
    tips.push('Heat stress likely: light irrigation, avoid midday field work.');
  } else if ((today.tmin_c ?? 99) <= 5) {
    tips.push('Cold risk: protect seedlings; consider pre-dawn light irrigation.');
  }
  if ((today.uv_index_max ?? 0) >= 8) {
    tips.push('High UV: schedule work for morning/evening and use sun protection.');
  }
  return tips;
}

export async function fetch_weather_by_coords(latitude, longitude) {
  const [res, city] = await Promise.all([
    fetch(build_url(latitude, longitude)),
    reverse_geocode(latitude, longitude)
  ]);

  let data;
  try { data = await res.json(); } catch { throw new Error('Weather JSON parse failed'); }
  if (!res.ok) {
    throw new Error(data?.error || data?.reason || `Weather request failed (${res.status})`);
  }

  const current = {
    temperature_c: data?.current?.temperature_2m ?? null,
    wind_speed_kmh: data?.current?.wind_speed_10m ?? null
  };

  const today = {
    tmax_c: data?.daily?.temperature_2m_max?.[0] ?? null,
    tmin_c: data?.daily?.temperature_2m_min?.[0] ?? null,
    precipitation_mm: data?.daily?.precipitation_sum?.[0] ?? 0,
    uv_index_max: data?.daily?.uv_index_max?.[0] ?? null,
    wind_gusts_kmh: data?.daily?.wind_gusts_10m_max?.[0] ?? null
  };

  return { city: city || 'Your location', current, today, advice: generate_advice(today, current) };
}
