const from_env =
  (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_BASE_URL) ||
  process.env.REACT_APP_API_BASE_URL

const default_base =
  window.location.hostname === 'localhost'
    ? 'http://localhost:5000'
    : 'https://sproj-p08.onrender.com'

const preferred_base = from_env || default_base

async function try_post_diagnose(base_url, file) {
  const form = new FormData()
  form.append('image', file)
  const response = await fetch(`${base_url}/api/diagnose`, { method: 'POST', body: form })
  let json = null
  try {
    json = await response.json()
  } catch {}
  return { response, json }
}

export async function diagnose_image(file) {
  // Try configured base first; on 404/network error, fall back to default Render API
  const bases_to_try = preferred_base === default_base ? [preferred_base] : [preferred_base, default_base]

  let last_error_message = 'Request failed'
  for (const base of bases_to_try) {
    try {
      const { response, json } = await try_post_diagnose(base, file)
      if (response.ok) {
        return json
      }
      // If 404 or 405 from a misconfigured backend, continue to next base
      if (response.status === 404 || response.status === 405) {
        last_error_message = (json && (json.message || json.error || json.detail)) || `Request failed (${response.status})`
        continue
      }
      const msg = (json && (json.message || json.error || json.detail)) || `Request failed (${response.status})`
      throw new Error(msg)
    } catch (e) {
      // On network errors, keep trying next base
      last_error_message = e && e.message ? e.message : 'Network error'
    }
  }
  throw new Error(last_error_message)
}
