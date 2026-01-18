import api from './api';

export const getAllSeries = async (params = {}) => {
  const response = await api.get('/booking-series', { params });
  return response.data;
};

export const getSeries = async (id) => {
  const response = await api.get(`/booking-series/${id}`);
  return response.data;
};

export const previewSeries = async (seriesData) => {
  const response = await api.post('/booking-series/preview', seriesData);
  return response.data;
};

export const createSeries = async (seriesData) => {
  const response = await api.post('/booking-series', seriesData);
  return response.data;
};

export const updateSeries = async (id, seriesData) => {
  const response = await api.put(`/booking-series/${id}`, seriesData);
  return response.data;
};

export const deleteSeries = async (id) => {
  const response = await api.delete(`/booking-series/${id}`);
  return response.data;
};
