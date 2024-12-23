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

const userSocketMap = new Map<string, Socket>()

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
      const { id } = socket.data.user

      // Check if the user already has a connected socket
      if (userSocketMap.has(id.toString())) {
        userSocketMap.get(id.toString())?.disconnect(true)
      }

      userSocketMap.set(id.toString(), socket)

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

      socket.data.taixiu = {
        taixiu: {
          coin_tai: 0,
          coin_xiu: 0,
          player_tai: 0,
          player_xiu: 0,
          phien: 0
        },
        logs: [],
        du_day: {}
      }

      socket.sendToTxUser = (data: any) => {
        if (!io) return
        socket.emit('taixiu', data)
      }

      socket.sendToTxUser({
        taixiu: {
          time_remain: io.TaiXiu_time
        }
      })

      socket.on('disconnect', async () => {
        socket.removeAllListeners()
        userSocketMap.delete(id.toString())
      })
    } catch (error) {
      console.log(error)
    }
  })

  chatSocket(io)
  gameSocket(io)
  initTaixiu()

  // taixiu
}
