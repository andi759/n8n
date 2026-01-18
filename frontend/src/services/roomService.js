import api from './api';

export const getAllRooms = async (params = {}) => {
  const response = await api.get('/rooms', { params });
  return response.data;
};

export const getRoom = async (id) => {
  const response = await api.get(`/rooms/${id}`);
  return response.data;
};

export const getRoomTypes = async () => {
  const response = await api.get('/rooms/types');
  return response.data;
};

export const createRoom = async (roomData) => {
  const response = await api.post('/rooms', roomData);
  return response.data;
};

export const updateRoom = async (id, roomData) => {
  const response = await api.put(`/rooms/${id}`, roomData);
  return response.data;
};
