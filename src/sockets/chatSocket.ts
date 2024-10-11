import { jwtDecode } from 'jwt-decode'
import { Server, Socket } from 'socket.io'
import { ISocketUser } from '~/contracts/socket'
import Chat from '~/models/Chat'
import PrivateMessage from '~/models/PrivateMessage'
import PublicMessage from '~/models/PublicMessage'
import Message from '~/models/PublicMessage'
import { User } from '~/models/User'
import { chatService } from '~/services'
// import User from '~/models/User'

export default function chatSocket(io: Server) {
  io.on('connection', (socket: Socket) => {
    // const { id, username } = socket.data.user ? (socket.data.user as SocketUser) : { id: '', username: '' }

    // Check if the user is online
    // socket.on('checkOnline', async ({ username }) => {
    //   const user = await User.findOne({ username: username }).exec()
    //   const isOnline = userSocketMap.has(user?.id)
    //   socket.emit('onlineStatus', {
    //     username,
    //     isOnline,
    //     lastOnline: user?.lastOnline
    //   })
    // })

    //Chat all
    socket.on('sendPublicMessage', async ({ sender, message }) => {
      try {
        const senderUser = await User.findById(sender).exec()
        console.log('Sender:', senderUser)

        if (!senderUser) {
          socket.emit('sendMessageFailure', {
            error: 'Sender not found'
          })
          return
        }

        console.log('Message:', message)
        // Save the message to the database
        const newMessage = new PublicMessage({
          sender: sender,
          message
        })

        newMessage.save()

        const messageSend = {
          _id: newMessage.id,
          sender: senderUser,
          // senderName: decoded.fullName,
          message: message,
          createAt: newMessage.createdAt
        }

        socket.broadcast
          .to('publicChannel')
          .emit('receivePublicMessage', messageSend)
        // io.emit('receiveMessage', messageSend)
      } catch (error) {
        console.error('Error sending group message:', error)
        socket.emit('sendMessageFailure', error)
      }
    })

    // Handle private message
    socket.on('sendMessage', async ({ sender, recipient, message }) => {
      console.log('sendMessage', sender, recipient, message)

      try {
        const senderUser = await User.findById(sender).exec()
        if (!senderUser) {
          socket.emit('sendMessageFailure', {
            error: 'Sender not found'
          })
          return
        }
        // Find sender and recipient users
        //const harshedSender = hashData(sender)

        // if (!decoded) {
        //   console.log('Sender not found:', sender)
        //   socket.emit('sendMessageFailure', 'Sender not found')
        //   return
        // }

        // console.log('Sender:', decoded)

        //const harshedRecipient = hashData(recipient)
        const recipientUser = await User.findById(recipient).exec()
        if (!recipientUser) {
          console.log('Recipient not found:', recipient)
          socket.emit('sendMessageFailure', 'Recipient not found')
          return
        }

        // console.log('Recipient:', recipientUser)

        // Check if Chat is created between sender and recipient
        let chat = await Chat.findOne({
          $or: [
            { members: [sender, recipient] },
            { members: [recipient, sender] }
          ]
        }).exec()

        console.log('Chat:', chat)
        if (!chat) {
          // Create a new chat
          console.log('Create new chat')
          chat = await chatService.create([sender, recipient])
          // chat = new Chat({
          //   members: [sender, recipient]
          // })
          // chat.save()
          socket.to(recipient).emit('newChat', chat)
          socket.emit('newChat', chat)
        }

        // Save the message to the database
        const newMessage = new PrivateMessage({
          sender: sender, //sender ID
          chat: chat.id,
          recipient: recipient, //recipient ID
          message
        })

        newMessage.save()

        const messageSend = {
          _id: newMessage.id,
          sender: senderUser,
          recipient: recipientUser,
          chat: chat.id,
          message,
          createdAt: newMessage.createdAt
        }

        io.to(recipient).emit('receiveMessage', messageSend)

        // Send the message to the sender
        // socket.emit('sendMessageSuccess', messageSend)
      } catch (error) {
        console.error('Error sending group message:', error)
        socket.emit('sendMessageFailure', error)
      }
    })
  })
}
