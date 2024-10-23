import mongoose from 'mongoose'
import mongooseLong from 'mongoose-long'

mongooseLong(mongoose)

export const {
  Types: { Long }
} = mongoose
