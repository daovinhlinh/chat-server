import { IJwtUser } from './jwt'

export interface ISocketUser {
  id: string
  role: string
  username: string
  email: string
  fullName: string
  isVerified: boolean
  phoneNumber: string
  balance: number
  binanceId: string
  enabledMfa: boolean
  exp: number
}

export interface ISocketData {
  user: IJwtUser
}
