import { Model, ObjectId } from 'mongoose'
import { CheckIn } from '~/models/CheckIn'

export interface ICheckIn {
  id: ObjectId
  user: ObjectId
  createdAt: Date
}

export type CheckInModel = Model<ICheckIn, unknown>

export type GetCheckInHistoryPayload = {
  user: ObjectId | undefined
  fromDate: string | null
  toDate: string | null
  page: number
  limit: number
}
