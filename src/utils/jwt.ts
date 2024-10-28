import jwt, { PrivateKey, PublicKey } from 'jsonwebtoken'
import { ObjectId } from 'mongoose'
import { redis } from '~/config/redis'

import { IJwtUser, IToken } from '../contracts/jwt'

export const jwtSign = (
  id: ObjectId,
  secret: string,
  expiresIn: string
): IToken => {
  const token = jwt.sign({ id }, secret, {
    expiresIn
  })

  return { token }
}

export const jwtVerify = (token: string, secret: string) => {
  return jwt.verify(token, secret) as IJwtUser
}

export const storeTokenInRedis = (token: string, userId: string) => {
  redis.client.set(userId, token, {
    EX: 60 * 15 // 15m
    // NX: true
  })
}
