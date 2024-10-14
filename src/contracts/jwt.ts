import { ObjectId } from 'mongoose'

export interface IJwtUser {
  id: ObjectId
  iat: number
  exp: number
}

export interface IToken {
  token: string
}
