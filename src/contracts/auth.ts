import { IUser } from './user'

export type SignInPayload = Pick<IUser, 'username' | 'password'>

export type SignUpPayload = Pick<IUser, 'username' | 'password' | 'role'>

export type SignOutPayload = {
  refreshToken: string
}

export type ResetPasswordPayload = Pick<IUser, 'email'>

export type NewPasswordPayload = Pick<IUser, 'password'>

export type VerifyOtpPayload = {
  username: string
  otp: string
}
