import { Server, Socket } from 'socket.io'
import { ITaiXiuSocketData } from '~/contracts/taixiu'
import { taixiuController } from '~/controllers/taixiuController'

export default function gameSocket(io: Server) {
  console.log('Game socket initialized')

  io.on('connection', (socket: Socket) => {
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
