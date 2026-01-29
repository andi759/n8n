import api from './api';

export const getCurrentWeek = async () => {
  const response = await api.get('/rotor/current-week');
  return response.data;
};

export const getWeekForDate = async (date) => {
  const response = await api.get(`/rotor/week-for-date/${date}`);
  return response.data;
};
