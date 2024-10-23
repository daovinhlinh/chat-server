//Tổng cược 1 user trong 1 phiên

import { model, Schema } from 'mongoose'
import { ITaiXiuOne } from '~/contracts/taixiu'

const schema: Schema = new Schema({
  uid: { type: String, required: true, index: true }, // ID Người cược
  phien: { type: Number, required: true, index: true }, // phiên cược
  bet: { type: Number, required: true }, // số tiền cược
  select: { type: Boolean, required: true }, // bên cược  (Tài = true, Xỉu = false)
  tralai: { type: Number, default: 0 }, // Số tiền trả lại
  thuong: { type: Number, default: 0 }, // Thưởng Red khi chơi bằng xu
  win: { type: Boolean, default: false }, // Thắng hoặc thua
  betwin: { type: Number, default: 0 } // Tiền thắng được
})

schema.index({ uid: 1, phien: 1 }, { background: true })

export const TaiXiuOne = model<ITaiXiuOne>('TaiXiu_one', schema)
