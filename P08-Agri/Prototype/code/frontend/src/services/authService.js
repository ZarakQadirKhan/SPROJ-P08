const API_BASE = process.env.REACT_APP_API_URL;

function pick_user(data) {
  if (!data) return null;
  if (data.user) return data.user;
  if (data.data && data.data.user) return data.data.user;
  if (data.profile) return data.profile;
  if (data.data && data.data.profile) return data.data.profile;
  return null;
}

async function handle_response(res) {
  let data = null;
  try {
    data = await res.json();
  } catch (_) {}
  if (!res.ok) {
    const message = (data && (data.error || data.message)) || `Request failed (${res.status})`;
    throw new Error(message);
  }
  const user = pick_user(data);
  return { raw: data, user };
}

export async function register(payload) {
  if (!API_BASE) {
    throw new Error("API base URL is not set");
  }
  const res = await fetch(`${API_BASE}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  return handle_response(res);
}

export async function login(payload) {
  if (!API_BASE) {
    throw new Error("API base URL is not set");
  }
  const res = await fetch(`${API_BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  return handle_response(res);
}
