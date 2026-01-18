import api from './api';

export const getCurrentWeek = async () => {
  const response = await api.get('/rotor/current-week');
  return response.data;
};

export const getWeekForDate = async (date) => {
  const response = await api.get(`/rotor/week-for-date/${date}`);
  return response.data;
};

export const setCycleStart = async (startDate) => {
  const response = await api.post('/rotor/set-cycle-start', { start_date: startDate });
  return response.data;
};
