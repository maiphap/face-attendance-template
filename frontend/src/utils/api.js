import axios from 'axios';

const api = axios.create({
  baseURL: 'http://127.0.0.1:5000', // Đảm bảo đúng địa chỉ và port
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    console.log('Token sent:', token);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default api;