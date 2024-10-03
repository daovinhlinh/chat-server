import mongoose, { Schema, Document } from 'mongoose'
// import { IGroup } from './Group'
// import { IUser } from './User'
// import { IChat } from './Chat'

export interface IPublicMessage extends Document {
  sender: string
  message: string
  createdAt: Date
}

const messageSchema: Schema = new Schema({
  sender: { type: mongoose.Schema.Types.String, required: true },
  message: { type: String },
  createdAt: { type: Date, default: Date.now }
})

export default mongoose.model<IPublicMessage>('PublicMessage', messageSchema)
