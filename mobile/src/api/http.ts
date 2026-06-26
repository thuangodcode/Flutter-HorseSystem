import axios from 'axios';
import * as Storage from '../utils/storage';

export const http = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL || 'https://managerhourse-be.onrender.com',
  headers: {
    'Content-Type': 'application/json',
  },
});

http.interceptors.request.use(async (config) => {
  const token = await Storage.getItemAsync('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

http.interceptors.response.use((response) => response, (error) => {
  return Promise.reject(error);
});
