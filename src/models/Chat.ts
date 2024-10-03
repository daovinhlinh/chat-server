import mongoose, { Schema } from 'mongoose'

export interface IChat extends Document {
  members: string[]
  createdAt: Date
}

const chatSchema: Schema = new Schema({
  members: [{ type: mongoose.Schema.Types.String, required: true }],
  createdAt: { type: Date, default: Date.now }
})

export default mongoose.model<IChat>('Chat', chatSchema)
