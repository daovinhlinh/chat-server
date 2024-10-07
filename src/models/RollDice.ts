import mongoose, { Schema, Document } from 'mongoose'
import { IRollDice } from '~/contracts/game'

const schema: Schema = new Schema(
  {
    user: { type: mongoose.Types.ObjectId, ref: 'User', required: true },
    result: { type: Boolean, required: true },
    coins: { type: Number, required: true }
  },
  {
    timestamps: true
  }
)

export default mongoose.model<IRollDice>('RollDice', schema)
