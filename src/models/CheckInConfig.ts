import { Document, model, Schema } from 'mongoose'
import { CheckInModel, ICheckIn } from '~/contracts/checkin'
import { CheckInConfigModel, ICheckInConfig } from '~/contracts/checkinConfig'

const specialDaySchema = new Schema({
  date: { type: Schema.Types.Date, required: true }, // Format: YYYY-MM-DD
  coins: { type: Number, required: true }
})

const schema = new Schema<ICheckInConfig, CheckInConfigModel, Document>(
  {
    defaultCoins: {
      type: Schema.Types.Number,
      required: true
    },
    specialDays: {
      type: [specialDaySchema],
      default: []
    }
  },
  { timestamps: true }
)

export const CheckInConfig = model<ICheckInConfig, CheckInConfigModel>(
  'CheckInConfig',
  schema
)
