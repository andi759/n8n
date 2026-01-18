import api from './api';

export const getAllClinics = async (activeOnly = true) => {
  const response = await api.get('/clinics', {
    params: { active_only: activeOnly }
  });
  return response.data;
};

export const getClinicById = async (id) => {
  const response = await api.get(`/clinics/${id}`);
  return response.data;
};

export const getClinicRooms = async (clinicId, activeOnly = true) => {
  const response = await api.get(`/clinics/${clinicId}/rooms`, {
    params: { active_only: activeOnly }
  });
  return response.data;
};

export const createClinic = async (clinicData) => {
  const response = await api.post('/clinics', clinicData);
  return response.data;
};

export const updateClinic = async (id, clinicData) => {
  const response = await api.put(`/clinics/${id}`, clinicData);
  return response.data;
};

export const deleteClinic = async (id) => {
  const response = await api.delete(`/clinics/${id}`);
  return response.data;
};
