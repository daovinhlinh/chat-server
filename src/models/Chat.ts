import mongoose, { Document, Schema } from 'mongoose'
import { ChatModel, IChat } from '~/contracts/chat'

const schema: Schema = new Schema<IChat, ChatModel>(
  {
    members: [
      { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
    ]
  },
  { timestamps: true }
)

export default mongoose.model<IChat, ChatModel>('Chat', schema)
