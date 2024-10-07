import { Document, model, Schema } from 'mongoose'
import { CheckInModel, ICheckIn } from '~/contracts/checkin'

const schema = new Schema<ICheckIn, CheckInModel, Document>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }
  },
  { timestamps: true }
)

export const CheckIn = model<ICheckIn, CheckInModel>('CheckIn', schema)
