import { Model, ObjectId } from 'mongoose'

export interface IChat {
  id: ObjectId
  members: string[]
  createdAt: Date
}

export type ChatModel = Model<IChat, unknown>
