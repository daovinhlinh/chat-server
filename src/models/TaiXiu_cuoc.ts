import { MongooseAutoIncrementID } from 'mongoose-auto-increment-reworked'
import { Schema, model } from 'mongoose'
import { ITaiXiuCuoc } from '~/contracts/taixiu'

const schema: Schema = new Schema({
  uid: { type: String, required: true }, // ID Người cược
  name: { type: String, required: true }, // Name Người cược
  phien: { type: Number, required: true, index: true }, // phiên cược
  bet: { type: Number, required: true }, // số tiền cược
  select: { type: Boolean, required: true }, // bên cược  (Tài = true, Xỉu = false)
  tralai: { type: Number, default: 0 }, // Số tiền trả lại
  thanhtoan: { type: Boolean, default: false }, // tình trạng thanh toán
  win: { type: Boolean, default: false }, // Thắng hoặc thua
  betwin: { type: Number, default: 0 }, // Tiền thắng được
  wincaonhat: { type: Number, default: 0 },
  time: { type: Date }, // thời gian cược
  bot: { type: Boolean, default: false } // là botqa
})

schema.plugin(MongooseAutoIncrementID.plugin, {
  modelName: 'TaiXiu_cuoc',
  field: 'id'
})

schema.index({ uid: 1, thanhtoan: 1 }, { background: true })

export const TaiXiuCuoc = model<ITaiXiuCuoc>('TaiXiu_cuoc', schema)
