import jwt, { PrivateKey, PublicKey } from 'jsonwebtoken'
import { ObjectId } from 'mongoose'

import { IJwtUser, IToken } from '../contracts/jwt'
console.log(process.env.JWT_SECRET_KEY)

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
