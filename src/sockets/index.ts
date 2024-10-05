import { DefaultEventsMap, Server, Event } from 'socket.io'
import jwt from 'jsonwebtoken'
import chatSocket from './chatSocket'
import { jwtVerify } from '~/utils/jwt'
import { ISocketData, ISocketUser } from '~/contracts/socket'

export const initializeSockets = (
  io: Server<DefaultEventsMap, Event, DefaultEventsMap, ISocketData>
) => {
  io.use((socket, next) => {
    const token = socket.handshake.auth.token || socket.handshake.headers?.token
    // console.log('Token:', token)
    if (!token) {
      console.log('Authentication token missing')
      return next(new Error('Authentication token missing'))
    }
    try {
      const user = jwtVerify({ accessToken: token })
      if (user && user.id) {
        Object.assign(socket.data, { user })
        next()
      }
    } catch (error) {}

    // const jwtToken = process.env.JWT_SECRET_KEY as string

    // // Verify and decode the token
    // jwt.verify(token, jwtToken, (err: jwt.VerifyErrors | null, decoded: any) => {
    //   if (err) {
    //     console.log('Authentication token invalid')
    //     return next(new Error('Authentication token invalid'))
    //   }

    //   console.log('User authenticated', (decoded as ISocketUser).username)

    //   // Attach user information to socket for later use
    //   socket.data.user = decoded.user
    //   next()
    // })
  })

  io.on('connection', async socket => {
    try {
      console.log(socket.data.user)

      const { id } = socket.data.user
      socket.join(id as unknown as string)
      socket.join('publicChannel')

      socket.on('disconnect', async () => {
        console.log('User disconnected:', socket.data.user)
      })
    } catch (error) {
      console.log(error)
    }
  })

  chatSocket(io)
}
