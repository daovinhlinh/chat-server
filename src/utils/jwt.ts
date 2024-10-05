import jwt, { PrivateKey, PublicKey } from 'jsonwebtoken'
import { ObjectId } from 'mongoose'

import { IAccessToken, IJwtUser } from '../contracts/jwt'
console.log(process.env.JWT_SECRET_KEY)

export const jwtSign = (id: ObjectId): IAccessToken => {
  const accessToken = jwt.sign({ id }, process.env.JWT_SECRET_KEY as PrivateKey, {
    expiresIn: process.env.JWT_EXPIRATION
  })

  return { accessToken }
}

export const jwtVerify = ({ accessToken }: { accessToken: string }) => {
  return jwt.verify(accessToken, process.env.JWT_SECRET_KEY as PublicKey) as IJwtUser
}
