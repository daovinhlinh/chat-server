import { Model, ObjectId } from 'mongoose'

export interface IChat {
  id: ObjectId
  members: ObjectId[]
  createdAt: Date
}

export type ChatModel = Model<IChat, unknown>
