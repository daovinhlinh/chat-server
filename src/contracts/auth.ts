import { IUser } from './user'

export type SignInPayload = Pick<IUser, 'username' | 'password'>

export type SignUpPayload = Pick<
  IUser,
  'username' | 'password' | 'firstName' | 'lastName' | 'role'
>

export type ResetPasswordPayload = Pick<IUser, 'email'>

export type NewPasswordPayload = Pick<IUser, 'password'>
