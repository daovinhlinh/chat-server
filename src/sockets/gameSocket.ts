import { Server, Socket } from 'socket.io'

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
  })
}
