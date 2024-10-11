import { DefaultEventsMap, Server, Event, Socket } from 'socket.io'
import jwt from 'jsonwebtoken'
import chatSocket from './chatSocket'
import { jwtVerify } from '~/utils/jwt'
import { ISocketData, ISocketUser } from '~/contracts/socket'
import gameSocket from './gameSocket'
import { userController } from '~/controllers'
import { userService } from '~/services'

export const initializeSockets = (
  io: Server<DefaultEventsMap, Event, DefaultEventsMap, ISocketData>
) => {
  io.use((socket, next) => {
    const token = socket.handshake.auth.token || socket.handshake.headers?.token

    if (!token) {
      console.log('Authentication token missing')
      return next(new Error('Authentication token missing'))
    }
    try {
      const user = jwtVerify({ accessToken: token })
      if (user && user.id) {
        Object.assign(socket.data, { user })
        next()
      } else {
        next(new Error('Authentication error: Invalid user'))
      }
    } catch (error: Error | any) {
      next(new Error('Authentication error: ' + error.message))
    }
  })

  io.on('connection', async socket => {
    socket.removeAllListeners()
    try {
      console.log(socket.data.user)

      const { id } = socket.data.user
      socket.join(id as unknown as string)
      socket.join('publicChannel')
      // socket.join('notification')

      // const token =
      //   socket.handshake.auth.token || socket.handshake.headers?.token
      // try {
      //   const user = jwtVerify({ accessToken: token })
      //   if (user && user.id) {
      //     const currentUser = await userService.getById(user.id)
      //     if (!currentUser) {
      //       return
      //     }

      //     if (currentUser.role === 'admin') {

      //     }
      //   }
      // } catch (error) {}
      socket.on('disconnect', async () => {
        socket.removeAllListeners()
      })
    } catch (error) {
      console.log(error)
    }
  })

  chatSocket(io)
  gameSocket(io)
}
