import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000/api',
});

api.interceptors.request.use((config) => {
  const role = localStorage.getItem('userRole');
  const id = localStorage.getItem('userId');

  if (role) {
    config.headers['x-user-role'] = role;
  }
  if (id) {
    config.headers['x-user-id'] = id;
  }

  return config;
});

export default api;
