import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';
const API_URL = `${API_BASE}/api/weather`;

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

export const fetch_weather_by_coords = async (latitude, longitude) => {
  try {
    const response = await api.get('/', { params: { lat: latitude, lon: longitude } });
    return response.data;
  } catch (error) {
    throw error?.response?.data?.message || 'Weather fetch failed';
  }
};

export default { fetch_weather_by_coords };
