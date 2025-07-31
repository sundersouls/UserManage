import axios from 'axios';
const API_BASE_URL = process.env.REACT_APP_API_URL;

const api = axios.create({
  baseURL: API_BASE_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface User {
  id: number;
  name: string;
  email: string;
  is_blocked: boolean;
  last_login: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export const authAPI = {
  login: async (data: LoginData) => {
    const response = await api.post('/login', data);
    return response.data;
  },
  
  getUsers: async (userId: number): Promise<User[]> => {
    const response = await api.get('/users', {params: { id: userId }});
    return response.data;
  },

  register: async (data: RegisterData): Promise<AuthResponse> => {
    const response = await api.post('/register', data);
    return response.data;
  },
  
  updateUserStatus: async (userIds: number[], isBlocked: boolean) => {
    const response = await api.put('/users/block', { userIds, isBlocked });
    return response.data;
  },
  
  deleteUsers: async (userIds: number[]) => {
    const response = await api.delete('/users', { data: { userIds } });
    return response.data;
  }
};