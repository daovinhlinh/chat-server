import mongoose, { Schema } from 'mongoose'
import { IPrivateMessage, PrivateMessageModel } from '~/contracts/message'

const schema: Schema = new Schema<IPrivateMessage, PrivateMessageModel>(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    chat: { type: mongoose.Schema.Types.ObjectId, ref: 'Chat', required: true },
    message: { type: String },
    isReaded: { type: Boolean, default: false }
  },
  { timestamps: true }
)

export default mongoose.model<IPrivateMessage, PrivateMessageModel>(
  'PrivateMessage',
  schema
)
