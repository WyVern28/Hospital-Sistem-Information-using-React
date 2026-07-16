/** Credentials accepted by the patient sign-in flow. */
export interface LoginCredentials {
  emailOrPhone: string
  password: string
}

/** Fields collected when a patient creates an account. */
export interface SignupCredentials {
  name: string
  email: string
  password: string
}
