import { Model, ObjectId } from 'mongoose'
import { IChat } from './chat'
import { IUser } from './user'

export interface IPublicMessage {
  id: ObjectId
  sender: IUser
  message: string
  createdAt: Date
}

export type PublicMessageModel = Model<IPublicMessage, unknown>

export interface IPrivateMessage {
  id: ObjectId
  sender: IUser
  chat: IChat
  recipient: IUser
  message: string
  isReaded: boolean
  createdAt: Date
}

export type PrivateMessageModel = Model<IPrivateMessage, unknown>

export type GetPrivateMessagePayload = Pick<IPrivateMessage, 'id'>
