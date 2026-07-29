import axios from 'axios';

const API_URL = 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const login = async (username, password) => {
  const formData = new URLSearchParams();
  formData.append('username', username);
  formData.append('password', password);
  const response = await api.post('/login', formData, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
  });
  return response.data;
};

export const register = async (username, password, full_name, system_role, job_role, allowed_domains = "") => {
  const response = await api.post('/register', { username, password, full_name, system_role, job_role, allowed_domains });
  return response.data;
};

export const runQuery = async (query) => {
  const response = await api.post('/query', { query });
  return response.data;
};

export const ingestData = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await api.post('/ingest', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return response.data;
};

export const getUsers = async () => {
  const response = await api.get('/admin/users');
  return response.data;
};

export const createItTicket = async (data) => {
  const response = await api.post('/admin/it-tickets', data);
  return response.data;
};

export const createHrLeave = async (data) => {
  const response = await api.post('/admin/hr-leaves', data);
  return response.data;
};

export const getUserItTickets = async (userId) => {
  const response = await api.get(`/admin/it-tickets/${userId}`);
  return response.data;
};

export const getUserHrLeaves = async (userId) => {
  const response = await api.get(`/admin/hr-leaves/${userId}`);
  return response.data;
};

export const updateItTicket = async (ticketId, data) => {
  const response = await api.put(`/admin/it-tickets/${ticketId}`, data);
  return response.data;
};

export const updateHrLeave = async (recordId, data) => {
  const response = await api.put(`/admin/hr-leaves/${recordId}`, data);
  return response.data;
};

export default api;
