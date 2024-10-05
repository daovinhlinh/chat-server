import { Model, ObjectId } from 'mongoose'

export interface IUser {
  id: ObjectId
  username: string
  email: string
  password: string
  firstName: string
  lastName: string
  phoneNumber?: string
  role: 'user' | 'admin'
  verified: boolean
  createdAt: Date
}

export interface IUserMethods {
  comparePassword: (password: string) => boolean
}

export type UserModel = Model<IUser, unknown, IUserMethods>

export type UpdateProfilePayload = Required<
  Pick<IUser, 'firstName' | 'lastName'>
>

export type UpdateEmailPayload = Pick<IUser, 'email' | 'password'>

export interface UpdatePasswordPayload {
  oldPassword: string
  newPassword: string
}

export interface DeleteProfilePayload {
  password: string
}
