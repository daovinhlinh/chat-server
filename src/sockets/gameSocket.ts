import { Server, Socket } from 'socket.io'
import { ITaiXiuSocketData } from '~/contracts/taixiu'
import { taixiuController } from '~/controllers/taixiuController'

let gameSocketInstance: Socket

export const getGameSocket = () => gameSocketInstance

export default function gameSocket(io: Server) {
  io.on('connection', (socket: Socket) => {
    if (socket) {
      gameSocketInstance = socket
    }

    socket.on('pushNotification', data => {
      try {
        console.log('Push notification:', data)

        socket.broadcast.emit('receiveNotification', {
          message: data
        })
      } catch (error) {
        console.log(error)
      }
    })

    socket.on('taixiu', (data: ITaiXiuSocketData) => {
      if (data.cuoc) {
        taixiuController.cuoc(socket, data.cuoc)
      }

      if (data.getLogs) {
        taixiuController.getLogs(socket)
      }

      if (data.getHistory) {
        taixiuController.getHistory(socket, data.getHistory)
      }
    })
  })
}
