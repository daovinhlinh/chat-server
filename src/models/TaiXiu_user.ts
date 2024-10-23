import { model, Schema } from 'mongoose'
import { ITaiXiuUser } from '~/contracts/taixiu'

const schema: Schema = new Schema({
  uid: { type: String, required: true, unique: true }, // ID Người chơi
  tCoinPlay: { type: Number, default: 0 }, // Red Tài Xỉu đã chơi
  tWinCoin: { type: Number, default: 0, index: true }, // Tổng Coin thắng
  tLostCoin: { type: Number, default: 0, index: true }, // Tổng Coin thua
  total: { type: Number, default: 0, index: true }, // Thắng trừ thua
  tLineWinCoin: { type: Number, default: 0 }, // Dây thắng Coin
  tLineLostCoin: { type: Number, default: 0 }, // Dây thua Coin
  first: { type: Number, default: 0 }, // Red - TX - Phiên đầu tiên
  last: { type: Number, default: 0 }, // Red - TX - Phiên cuối cùng
  tLineWinCoinH: { type: Number, default: 0, index: true }, // Dây thắng Coin hiện tại
  tLineLostCoinH: { type: Number, default: 0, index: true } // Dây thua Coin hiện tại
})

export const TaiXiuUser = model<ITaiXiuUser>('TaiXiu_user', schema)
