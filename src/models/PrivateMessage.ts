import mongoose, { Schema, Document } from 'mongoose'
import { IChat } from './Chat'
// import { IGroup } from './Group'
// import { IUser } from './User'
// import { IChat } from './Chat'

export interface IPrivateMessage extends Document {
  sender: string
  chat: IChat
  recipient: string
  message: string
  isReaded: boolean
  createdAt: Date
}

const messageSchema: Schema = new Schema({
  sender: { type: mongoose.Schema.Types.String, required: true },
  recipient: { type: mongoose.Schema.Types.String, required: true },
  chat: { type: mongoose.Schema.Types.ObjectId, ref: 'Chat', required: true },
  message: { type: String },
  isReaded: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
})

export default mongoose.model<IPrivateMessage>('PrivateMessage', messageSchema)
