import { IJwtUser } from './jwt'
import { ITaiXiuData } from './taixiu'

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

export interface ITaiXiuLogData {
  taixiu: ITaiXiuData
  logs: {
    dice: number[]
    phien: number
  }[]
  du_day: Partial<{
    tLineWinCoin: number
    tLineLostCoin: number
    tLineWinCoinH: number
    tLineLostCoinH: number
  }>
}

export interface ISocketData {
  user: IJwtUser
  taixiu: ITaiXiuLogData
}
