import { Schema, model } from 'mongoose'
import { compareSync } from 'bcrypt'
import { IUser, IUserMethods, UserModel, UserRole } from '~/contracts/user'

const schema = new Schema<IUser, UserModel, IUserMethods>(
  {
    username: {
      type: String,
      required: true
    },
    email: {
      type: String
    },
    password: {
      type: String,
      required: true
    },
    phoneNumber: { type: String },
    coins: {
      //Tổng tiền
      type: Number,
      default: 0
    },
    coinsWin: {
      //Tổng tiền thắng
      type: Number,
      default: 0
    },
    coinsLose: {
      //Tổng tiền thua
      type: Number,
      default: 0
    },
    total: {
      //Thắng trừ thua
      type: Number,
      default: 0,
      index: true
    },
    coinsPlayed: {
      //Tổng tiền đã chơi
      type: Number,
      default: 0
    },
    nohu: {
      //Tổng số lần nổ hũ
      type: Number,
      default: 0
    },
    role: {
      type: String,
      enum: UserRole,
      default: UserRole.USER
    },
    verified: {
      type: Boolean,
      default: false
    },
    isGuest: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
)

schema.methods.comparePassword = function (password: string) {
  return compareSync(password, this.password)
}

schema.methods.toJSON = function () {
  const obj = this.toObject()

  delete obj.password

  return obj
}

export const User = model<IUser, UserModel>('User', schema)
