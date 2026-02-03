import axios from 'axios';

// Create a separate axios instance for public API calls (no auth token)
const publicApi = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api/public',
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
