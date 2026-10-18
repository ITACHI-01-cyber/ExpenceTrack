import axios from 'axios';
import useAuthStore from '../store/authStore';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL
    || (import.meta.env.PROD ? 'https://expencetrack.onrender.com/api' : 'http://localhost:8080/api'),
});

console.log("API Base URL currently in use:", api.defaults.baseURL);

api.interceptors.request.use((config) => {
  const { token } = useAuthStore.getState();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      useAuthStore.getState().logout();
    }
    return Promise.reject(error);
  }
);

export default api;

// Media references are stored by the API as `/api/media/...`; make them work
// against both a local API and the deployed API instead of the Vite origin.
export const apiAssetUrl = (reference) => {
  if (!reference || /^https?:\/\//i.test(reference) || reference.startsWith('data:')) return reference;
  const origin = api.defaults.baseURL.replace(/\/api\/?$/, '');
  return `${origin}${reference.startsWith('/') ? reference : `/${reference}`}`;
};
