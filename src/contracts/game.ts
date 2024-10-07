import { Model, ObjectId } from 'mongoose'

export interface IRollDice {
  id: ObjectId
  user: ObjectId
  result: boolean
  // win/lose coin
  coins: number
  createdAt: Date
}

export type RollDiceModel = Model<IRollDice, unknown>

export type RollDicePayload = {
  totalOverBet: number
  totalUnderBet: number
  numDice: number
  maxUnderPoint: number
}

export type UpdateCoinPayload = {
  coins: string
  userId: ObjectId
}
