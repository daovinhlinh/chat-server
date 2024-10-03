import mongoose, { Document } from 'mongoose'

export interface IUser extends Document {
  username: string
  email: string
  lastName: string
  firstName: string
  fullName: string
  isVerified: boolean
  phoneNumber: string
  isDisabled: boolean
  balance: number
  vnd: any
  binanceId: string
  enabledMfa: boolean
  refId: string
  refCode: any
}

// export default mongoose.model<IUser>('User', userSchema)
