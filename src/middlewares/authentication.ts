import { NextFunction, Request, Response } from 'express'
import jwt from 'jsonwebtoken'
import { IUser } from '~/models/User'

export interface IRequestWithUser extends Request {
  user?: IUser
}

const authenticateToken = (req: IRequestWithUser, res: Response, next: NextFunction) => {
  console.log(req.headers)

  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]

  if (token == null) return res.sendStatus(401) // if there isn't any token

  jwt.verify(token, process.env.JWT_SECRET_KEY as string, (err, user) => {
    if (err) return res.sendStatus(403)
    req.user = user as IUser
    next()
  })
}

export default { authenticateToken }
