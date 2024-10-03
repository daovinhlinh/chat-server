import { Server } from 'socket.io'
import jwt from 'jsonwebtoken'
import chatSocket from './chatSocket'

export interface SocketUser {
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

export const initializeSockets = (io: Server) => {
  io.use((socket, next) => {
    const token = socket.handshake.auth.token || socket.handshake.headers?.token
    // console.log('Token:', token)
    if (!token) {
      console.log('Authentication token missing')
      return next(new Error('Authentication token missing'))
    }

    const jwtToken = process.env.JWT_SECRET_KEY as string

    // Verify and decode the token
    jwt.verify(token, jwtToken, (err: jwt.VerifyErrors | null, decoded: any) => {
      if (err) {
        console.log('Authentication token invalid')
        return next(new Error('Authentication token invalid'))
      }

      console.log('User authenticated', (decoded as SocketUser).username)

      // Attach user information to socket for later use
      socket.data.user = decoded.user
      next()
    })
  })

  chatSocket(io)
}
