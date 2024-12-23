import { NextFunction, Request, Response } from 'express'
import { redis } from '~/config/redis'
import { userService } from '~/services/userService'

import { getAccessTokenFromHeaders } from '~/utils/headers'
import { jwtVerify } from '~/utils/jwt'
// import { redis } from '@/dataSources'

export const authMiddleware = async (
  req: Request,
  _: Response,
  next: NextFunction
): Promise<void> => {
  try {
    Object.assign(req, { context: {} })

    const { accessToken } = getAccessTokenFromHeaders(req.headers)
    if (!accessToken) return next()

    const { id } = jwtVerify(accessToken, process.env.JWT_SECRET_KEY)

    if (!id) return next()

    try {
      const storedToken = await redis.client.get(id.toString())
      if (!storedToken || storedToken !== accessToken) {
        return next()
      }
    } catch (err) {
      console.error('Error checking stored token:', err)
      return next()
    }

    const isAccessTokenExpired = await redis.client.get(
      `expiredToken:${accessToken}`
    )

    if (isAccessTokenExpired) return next()

    const user = await userService.getById(id)
    if (!user) return next()

    Object.assign(req, {
      context: {
        user,
        accessToken
      }
    })

    return next()
  } catch (error) {
    return next()
  }
}
