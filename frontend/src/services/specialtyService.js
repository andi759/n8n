import api from './api';

export const getAllSpecialties = async () => {
    const response = await api.get('/specialties');
    return response.data;
};

export const getSpecialtyById = async (id) => {
    const response = await api.get(`/specialties/${id}`);
    return response.data;
};

export const createSpecialty = async (specialtyData) => {
    const response = await api.post('/specialties', specialtyData);
    return response.data;
};

export const updateSpecialty = async (id, specialtyData) => {
    const response = await api.put(`/specialties/${id}`, specialtyData);
    return response.data;
};

export const deleteSpecialty = async (id) => {
    const response = await api.delete(`/specialties/${id}`);
    return response.data;
};
