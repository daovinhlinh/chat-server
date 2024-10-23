import { model, Schema } from 'mongoose'
import { IHuTx } from '~/contracts/taixiu'

const schema: Schema = new Schema({
  uid: { type: String, default: '' },
  name: { type: String, default: '' }, // Tên người được gọi
  phien: { type: Number, default: 0 }, // Phien
  nhan: { type: Number, default: 0 }, // Hu nhan $
  quyhu: { type: Number, default: 0 }, //quy hu khi no
  ketqua: { type: Number, default: 0 }, //ketqua tai xiu
  tongtiendat: { type: Number, default: 0 }, //tong tien dat
  tonguser: { type: Number, default: 0 }, //ketqua so nguoi chon
  lenh: { type: Number, default: 0 }, //
  time: { type: Date, default: new Date() },
  phiennohu: { type: Number, default: 0 }
})

export const HuTx = model<IHuTx>('hutx', schema)
