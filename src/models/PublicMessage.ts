import mongoose, { Schema } from 'mongoose'
import { IPublicMessage, PublicMessageModel } from '~/contracts/message'

const schema: Schema = new Schema<IPublicMessage, PublicMessageModel>(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    message: { type: String }
  },
  { timestamps: true }
)

export default mongoose.model<IPublicMessage, PublicMessageModel>(
  'PublicMessage',
  schema
)
