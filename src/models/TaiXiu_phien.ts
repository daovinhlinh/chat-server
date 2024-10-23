import { MongooseAutoIncrementID } from 'mongoose-auto-increment-reworked'
import { Schema, model } from 'mongoose'
import { ITaiXiuPhien } from '~/contracts/taixiu'

const schema: Schema = new Schema({
  dice1: { type: Number },
  dice2: { type: Number },
  dice3: { type: Number },
  md5tx: { type: String },
  md5hash: { type: String },
  md5last: { type: String },
  userchontai: { type: Number },
  userchonxiu: { type: Number },
  jackpot: { type: String },
  time: { type: Date, default: new Date() }
})

schema.plugin(MongooseAutoIncrementID.plugin, {
  modelName: 'TaiXiu_phien',
  field: 'id'
})

export const TaiXiuPhien = model<ITaiXiuPhien>('TaiXiu_phien', schema)
