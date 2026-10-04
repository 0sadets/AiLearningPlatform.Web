import api from './axiosInstance'

import type {
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  UpdateProfileRequest,
  UserProfile,
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

export const getCurrentUser = async (): Promise<UserProfile> => {
  const response = await api.get<UserProfile>(
    '/api/auth/me',
  )

  return response.data
}

export const updateProfile = async (
  data: UpdateProfileRequest,
): Promise<UserProfile> => {
  const formData = new FormData()

  formData.append('FirstName', data.firstName)
  formData.append('LastName', data.lastName)

  if (data.phoneNumber) {
    formData.append('PhoneNumber', data.phoneNumber)
  }

  if (data.dateOfBirth) {
    formData.append('DateOfBirth', data.dateOfBirth)
  }

  if (data.avatar) {
    formData.append('Avatar', data.avatar)
  }

  formData.append(
    'RemoveAvatar',
    data.removeAvatar.toString(),
  )

  const response = await api.put<UserProfile>(
    '/api/auth/me',
    formData,
  )

  return response.data
}