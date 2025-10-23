import axios from 'axios';

const API_URL = 'http://localhost:5000/api/weather';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' }
});

export const fetch_weather_by_coords = async (latitude, longitude) => {
  try {
    const response = await api.get('/', { params: { lat: latitude, lon: longitude } });
    return response.data;
  } catch (error) {
    const message_text = error?.response?.data?.message || 'Weather fetch failed';
    throw message_text;
  }
};

const weather_service = { fetch_weather_by_coords };

export default weather_service;
