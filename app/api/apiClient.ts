import axios from 'axios';
import { getAccessTokenCookie } from '@/utils/cookies';

// File này CHỈ NÊN được import bởi các component "use client"
// vì nó truy cập cookies và document

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL, // Lấy từ .env.local
  headers: {
    'Content-Type': 'application/json',
  },
});

// Dùng interceptor để tự động thêm token vào MỌI request mà instance 'api' này thực hiện
api.interceptors.request.use(
  (config) => {
    // Chỉ chạy ở phía client (trình duyệt)
    if (typeof window !== 'undefined') {
      const token = getAccessTokenCookie();
      if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export { api };