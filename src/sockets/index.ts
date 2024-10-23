import { DefaultEventsMap, Server, Event, Socket } from 'socket.io'
import jwt from 'jsonwebtoken'
import chatSocket from './chatSocket'
import { jwtVerify } from '~/utils/jwt'
import { ISocketData, ISocketUser } from '~/contracts/socket'
import gameSocket from './gameSocket'
import { userController } from '~/controllers'
import { userService } from '~/services'
import {
  ExtendedServer,
  init as initTaixiu,
  ServerToClientEvents
} from '~/crons/taixiu'

export interface ExtendedSocket
  extends Socket<
    DefaultEventsMap,
    ServerToClientEvents,
    DefaultEventsMap,
    ISocketData
  > {
  sendToTxUser?: (data: any) => void
}

export const initializeSockets = (io: ExtendedServer) => {
  io.sendToTxUser = (data: any) => {
    // if (!io) return
    io.emit('taixiu', data)
  }
  io.use((socket, next) => {
    const token = socket.handshake.auth.token || socket.handshake.headers?.token

    if (!token) {
      console.log('Authentication token missing')
      return next(new Error('Authentication token missing'))
    }
    try {
      const user = jwtVerify(token, process.env.JWT_SECRET_KEY)
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

  io.on('connection', async (socket: ExtendedSocket) => {
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

      socket.sendToTxUser = (data: any) => {
        if (!io) return
        socket.emit('taixiu', data)
      }

      socket.on('disconnect', async () => {
        socket.removeAllListeners()
      })
    } catch (error) {
      console.log(error)
    }
  })
  initTaixiu()

  chatSocket(io)
  gameSocket(io)

  // taixiu
}
