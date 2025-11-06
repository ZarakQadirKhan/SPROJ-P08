import axios from 'axios';

// Resolve backend base URL (works for CRA or Vite)
const fromEnv =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_BASE_URL) ||
  process.env.REACT_APP_API_BASE_URL;

const isLocalhost = typeof window !== 'undefined' && window.location.hostname === 'localhost';
const isVercel = typeof window !== 'undefined' && /\.vercel\.app$/.test(window.location.hostname);
const API_BASE = fromEnv || (isLocalhost ? 'http://localhost:5000' : (isVercel ? '' : 'https://sproj-p08-2.onrender.com'));
const API_URL = `${API_BASE}/api/auth`;

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Register new user
export const register = async (userData) => {
  try {
    // userData must be: { name, email, phone, password, role }
    const response = await api.post('/register', userData);
    if (response.data?.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  } catch (error) {
    const message = error?.response?.data?.message || error?.response?.data?.error || 'Registration failed';
    throw new Error(message);
  }
};

// Login user
export const login = async (credentials) => {
  try {
    const response = await api.post('/login', credentials);
    if (response.data?.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  } catch (error) {
    const message = error?.response?.data?.message || error?.response?.data?.error || 'Login failed';
    throw new Error(message);
  }
};

export const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};

export const getCurrentUser = () => {
  const userStr = localStorage.getItem('user');
  return userStr ? JSON.parse(userStr) : null;
};

export const getToken = () => localStorage.getItem('token');

export const isAuthenticated = () => !!getToken();

export default {
  register,
  login,
  logout,
  getCurrentUser,
  getToken,
  isAuthenticated,
};
