import { MongooseAutoIncrementID } from 'mongoose-auto-increment-reworked'
import { Schema, model } from 'mongoose'
import { ILichSuCuoc } from '~/contracts/taixiu'

const schema: Schema = new Schema({
  uid: { type: String, index: true }, // ID Người cược
  phien: { type: String }, // phiên cược
  select: { type: Boolean }, // bên cược  (Tài = true, Xỉu = false)
  tralai: { type: Number, default: 0 }, // Số tiền trả lại
  thuong: { type: Number, default: 0 }, // Thưởng Red khi chơi bằng xu
  betwin: { type: Number, default: 0 }, // Tiền thắng được
  thanhtoan: { type: Number, default: 1 },
  tienhienco: { type: Number },
  game: { type: String },
  name: { type: String },
  bet: { type: Number, default: 0 }, // Mức cược
  chitiet: { type: String },
  win: { type: Number, default: 0 }, // Tiền thắng
  lswin: { type: Number, default: 0 }, // Tiền thắng
  type: { type: Number, default: 0, index: true }, // Loại được ăn lớn nhất trong phiên
  kq: [],
  dichvu: { type: String },
  bigWin: { type: Boolean, default: false }, // Thắng lớn
  play: { type: Boolean, default: false }, // Phiên đang chơi
  goc: { type: Number, default: 0 }, // Tiền gốc (mức cược gốc)
  cuoc: { type: Number, default: 0 }, // Tiền cược
  card: {}, // Kết quả cuối cùng
  line: { type: Number, default: 0 }, // Số dòng chọn
  a: [],
  time: { type: Date, default: new Date() }
})

schema.plugin(MongooseAutoIncrementID.plugin, {
  modelName: 'LichSu_Cuoc',
  field: 'id'
})

export const LichSuCuoc = model<ILichSuCuoc>('LichSu_Cuoc', schema)
