import axios from 'axios'

const fromEnv =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_BASE_URL) ||
  process.env.REACT_APP_API_BASE_URL

const isLocalhost = typeof window !== 'undefined' && window.location.hostname === 'localhost'
const isVercel = typeof window !== 'undefined' && /\.vercel\.app$/.test(window.location.hostname)
const API_BASE = fromEnv || (isLocalhost ? 'http://localhost:5000' : (isVercel ? '' : 'https://sproj-p08-2.onrender.com'))
const API_URL = `${API_BASE}/api/auth`

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' }
})

export const register = async (userData) => {
  try {
    const response = await api.post('/register', userData)
    if (response.data && response.data.token) {
      localStorage.setItem('token', response.data.token)
      localStorage.setItem('user', JSON.stringify(response.data.user))
    }
    return response.data
  } catch (error) {
    const message = error && error.response && (error.response.data?.message || error.response.data?.error) ? (error.response.data.message || error.response.data.error) : 'Registration failed'
    throw new Error(message)
  }
}

export const registerWithOtp = async (userData) => {
  try {
    const response = await api.post('/register-otp', userData)
    return response.data
  } catch (error) {
    const message = error && error.response && (error.response.data?.message || error.response.data?.error) ? (error.response.data.message || error.response.data.error) : 'Registration failed'
    throw new Error(message)
  }
}

export const verifyOtp = async (payload) => {
  try {
    const response = await api.post('/verify-otp', payload)
    if (response.data && response.data.token) {
      localStorage.setItem('token', response.data.token)
      localStorage.setItem('user', JSON.stringify(response.data.user))
    }
    return response.data
  } catch (error) {
    const message = error && error.response && (error.response.data?.message || error.response.data?.error) ? (error.response.data.message || error.response.data.error) : 'OTP verification failed'
    throw new Error(message)
  }
}

export const login = async (credentials) => {
  try {
    const response = await api.post('/login', credentials)
    if (response.data && response.data.token) {
      localStorage.setItem('token', response.data.token)
      localStorage.setItem('user', JSON.stringify(response.data.user))
    }
    return response.data
  } catch (error) {
    const message = error && error.response && (error.response.data?.message || error.response.data?.error) ? (error.response.data.message || error.response.data.error) : 'Login failed'
    throw new Error(message)
  }
}

export const logout = () => {
  localStorage.removeItem('token')
  localStorage.removeItem('user')
}

export const getCurrentUser = () => {
  const userStr = localStorage.getItem('user')
  if (!userStr) {
    return null
  }
  try {
    const user = JSON.parse(userStr)
    return user
  } catch {
    return null
  }
}

export const getToken = () => {
  return localStorage.getItem('token')
}

export const isAuthenticated = () => {
  return !!getToken()
}

const authService = {
  register,
  registerWithOtp,
  verifyOtp,
  login,
  logout,
  getCurrentUser,
  getToken,
  isAuthenticated
}

export default authService
