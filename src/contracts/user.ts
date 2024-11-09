import { Model, ObjectId } from 'mongoose'

export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
  BOT = 'bot'
}

export interface IUser {
  _id: ObjectId
  username: string
  email: string
  password: string
  phoneNumber?: string
  role: UserRole
  coins: number
  coinsWin: number
  coinsLose: number
  total: number
  coinsPlayed: number
  nohu: number
  verified: boolean
  createdAt: Date
  isGuest: boolean
}

export interface IUserMethods {
  comparePassword: (password: string) => boolean
}

export type UserModel = Model<IUser, unknown, IUserMethods>

export type UpdateProfilePayload = Required<
  Pick<IUser, 'email' | 'phoneNumber'>
>

export type UpdateEmailPayload = Pick<IUser, 'email' | 'password'>

export interface UpdatePasswordPayload {
  oldPassword: string
  newPassword: string
}

export interface DeleteProfilePayload {
  userId: ObjectId
}

export type GetUserByIdPayload = {
  id: ObjectId
}

export type GetAllUsersPayload = {
  limit: number
  page: number
}

export type IUserWithoutId = Omit<IUser, '_id'>
