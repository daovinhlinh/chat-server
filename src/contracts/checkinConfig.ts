import { Model, ObjectId } from 'mongoose'

export interface ICheckInConfig {
  id: ObjectId
  defaultCoins: number
  specialDays: {
    _id: ObjectId
    date: Date
    coins: number
  }[]
}

export type CheckInConfigModel = Model<ICheckInConfig, unknown>

export type AddCheckInSpecialDayPayload = {
  date: string
  coins: string
}

export type UpdateCheckInCoinPayload = {
  coins: string
}

export type UpdateCheckInSpecialDayPayload = {
  id: ObjectId
  coins: string
}

export type DeleteCheckInSpecialDayPayload = Pick<ICheckInConfig, 'id'>
