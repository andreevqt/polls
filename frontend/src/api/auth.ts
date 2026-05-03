import { apiClient } from './client';
import type { User } from '../types/user';

export interface AuthResponse {
  user: User;
  accessToken: string;
}

export async function login(email: string, password: string): Promise<AuthResponse> {
  const { data } = await apiClient.post<AuthResponse>('/auth/login', { email, password });
  return data;
}

export async function register(
  name: string,
  email: string,
  password: string,
): Promise<AuthResponse> {
  const { data } = await apiClient.post<AuthResponse>('/auth/register', { name, email, password });
  return data;
}

export async function logout(): Promise<void> {
  await apiClient.post('/auth/logout');
}

export async function getMe(): Promise<User> {
  const { data } = await apiClient.get<User>('/auth/me');
  return data;
}

export async function refresh(): Promise<{ accessToken: string }> {
  const { data } = await apiClient.post<{ accessToken: string }>('/auth/refresh');
  return data;
}
