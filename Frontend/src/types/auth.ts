/** Credentials accepted by the patient sign-in flow. */
export interface LoginCredentials {
  emailOrPhone: string;
  password: string;
}

/** Fields collected when a patient creates an account. */
export interface SignupCredentials {
  name: string;
  email: string;
  phone?: string;
  nik: string;
  password: string;
}

export type UserRole = 'PATIENT' | 'DOCTOR' | 'ADMIN'

export interface User {
  id: number
  name: string
  email: string
  phone: string | null
  role: UserRole
  profileId: number | null
}

export interface LoginResponse {
  token: string
  user: User
}

export type AuthSession = LoginResponse
