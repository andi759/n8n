import axios from 'axios';

const API_BASE_URL = process.env.NODE_ENV === 'production' ? '/api' : 'http://localhost:5000/api';

const api = axios.create({ baseURL: API_BASE_URL });

export const submitWLIRequest = async (formData) => {
    const response = await api.post('/wli', formData);
    return response.data;
};
