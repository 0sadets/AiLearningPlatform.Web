export interface LoginRequest {
  email: string
  password: string
}

export interface AuthResponse {
  userId: number
  firstName: string
  lastName: string
  email: string
  token: string
  tokenExpiration: string
}

export interface RegisterRequest {
  firstName: string
  lastName: string
  email: string
  password: string
}

export interface UserProfile {
  id: number
  firstName: string
  lastName: string
  email: string
  phoneNumber: string | null
  dateOfBirth: string | null
  createdAt: string
  avatarUrl: string | null
}

export interface UpdateProfileRequest {
  firstName: string
  lastName: string
  phoneNumber?: string
  dateOfBirth?: string
  avatar?: File
  removeAvatar: boolean
}