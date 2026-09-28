import api from './axiosInstance'
import type {
  AuthResponse,
  CurrentUserResponse,
  LoginRequest,
  RegisterRequest,
} from '../types/auth'

export const login = async (
  data: LoginRequest,
): Promise<AuthResponse> => {
  const response = await api.post<AuthResponse>(
    '/api/auth/login',
    data,
  )

  return response.data
}

export const register = async (
  data: RegisterRequest,
): Promise<AuthResponse> => {
  const response = await api.post<AuthResponse>(
    '/api/auth/register',
    data,
  )

  return response.data
}

export const getCurrentUser = async (): Promise<CurrentUserResponse> => {
  const response = await api.get<CurrentUserResponse>(
    '/api/auth/me',
  )

  return response.data
}