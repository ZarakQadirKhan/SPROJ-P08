const API_BASE = process.env.REACT_APP_API_URL;

async function handle_response(response) {
  let data = null;
  try {
    data = await response.json();
  } catch (_) {}
  if (!response.ok) {
    const message = data?.error || data?.message || "Request failed";
    throw new Error(message);
  }
  return data;
}

export async function register(payload) {
  if (!API_BASE) {
    throw new Error("API base URL is not set");
  }
  const response = await fetch(`${API_BASE}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  return handle_response(response);
}

export async function login(payload) {
  if (!API_BASE) {
    throw new Error("API base URL is not set");
  }
  const response = await fetch(`${API_BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  return handle_response(response);
}
