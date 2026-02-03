import axios from 'axios';

// In production (on Render), use relative path. In development, use localhost.
const API_BASE_URL = process.env.NODE_ENV === 'production'
  ? '/api/public'
  : (process.env.REACT_APP_API_URL ? `${process.env.REACT_APP_API_URL}/public` : 'http://localhost:5000/api/public');

// Create a separate axios instance for public API calls (no auth token)
const publicApi = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const getPublicBookings = async (params = {}) => {
  const response = await publicApi.get('/bookings', { params });
  return response.data;
};

export const getPublicRooms = async (params = {}) => {
  const response = await publicApi.get('/rooms', { params });
  return response.data;
};

export const getPublicClinics = async (params = {}) => {
  const response = await publicApi.get('/clinics', { params });
  return response.data;
};

export const getPublicSpecialties = async () => {
  const response = await publicApi.get('/specialties');
  return response.data;
};
