// src/services/supportService.js

// Resolve your backend base URL (works for CRA or Vite)
const fromEnv =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_BASE_URL) ||
  process.env.REACT_APP_API_BASE_URL;

const isLocalhost = window.location.hostname === 'localhost'
const isVercel = /\.vercel\.app$/.test(window.location.hostname)
const API_BASE =
  fromEnv || (isLocalhost ? 'http://localhost:5000' : (isVercel ? '' : 'https://sproj-p08-2.onrender.com'));

export async function submitSupportRequest(formData) {
  const url = `${API_BASE}/api/support`;

  const res = await fetch(url, {
    method: 'POST',
    body: formData,
   
  });

  let data = null;
  try {
    data = await res.json();
  } catch {
    // keep data as null
  }

  if (!res.ok) {
    const msg =
      (data && (data.message || data.error || data.detail)) ||
      `Support request failed (${res.status})`;
    const error = new Error(msg);
    error.field = data?.field || null;
    error.status = res.status;
    throw error;
  }

  return data; // { success: true, message, ticketId, ticket: {...} }
}

