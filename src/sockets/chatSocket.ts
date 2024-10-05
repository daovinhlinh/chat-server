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
        const senderUser = await User.findOne({ username: sender }).exec()
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
        const recipientUser = await User.findOne({ username: recipient }).exec()
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
          sender: sender,
          chat: chat.id,
          recipient: recipient,
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

    // Handle deleting a message
    // socket.on('deleteMessage', async ({ messageId }) => {
    //   try {
    //     // Find the message
    //     const message = await Message.findById(messageId)
    //       .populate('sender')
    //       .populate('recipient')
    //       .populate('chat')
    //       .exec()

    //     if (!message) {
    //       socket.emit('deleteMessageFailure', 'Message not found')
    //       throw new Error('Message not found')
    //     }

    //     // Check if user is the sender or recipient of the message
    //     if (message.sender?.username !== username && message.recipient?.username !== username) {
    //       socket.emit('deleteMessageFailure', 'User is not the sender or recipient of the message')
    //       throw new Error('User is not the sender or recipient of the message')
    //     }

    //     const user = await User.findOne({ username: username }).exec()

    //     // Save chat id to DeleteChat
    //     const messageDelete = await MessageDelete.findOne({ chatId: message.chat._id.toString() }).exec()
    //     if (messageDelete) {
    //       if (!messageDelete.messages.includes(message._id.toString())) {
    //         messageDelete.messages.push(message._id.toString())
    //         messageDelete.save()
    //       }
    //     } else {
    //       MessageDelete.create({
    //         user: user,
    //         chatId: message.chat._id.toString(),
    //         messages: [message._id.toString()]
    //       })
    //     }

    //     // Delete the message
    //     await message.deleteOne()

    //     // Send delete message success response
    //     socket.emit('deleteMessageSuccess', messageId)

    //     if (message.recipient) {
    //       io.to(message.recipient.id).emit('messageDeleted', messageId)
    //     }

    //     if (message.sender) {
    //       io.to(message.sender.id).emit('messageDeleted', messageId)
    //     }
    //   } catch (error) {
    //     console.error('Error deleting message:', error)
    //     socket.emit('deleteMessageFailure')
    //   }
    // })

    // // Handle getting all chats of a user
    // socket.on('getChats', async ({ numberOfMessage }) => {
    //   try {
    //     // Find user
    //     const hashedUsername = username
    //     const user = await User.findOne({ username: hashedUsername }).exec()

    //     if (!user) {
    //       throw new Error('User not found')
    //     }
    //     console.log('hashedUsername:', hashedUsername)
    //     const userId = user._id
    //     console.log('userId:', userId)

    //     // Find all saved chat
    //     const savedChat = await Chat.find({ members: [user, user] }).exec()
    //     const archivedChat = await ChatArchive.find({ user: user }).exec()

    //     // Get all chat by user except saved chat
    //     const chats = await Chat.find({
    //       $and: [
    //         { members: user },
    //         { _id: { $nin: savedChat.map((chat) => chat._id) } },
    //         { _id: { $nin: archivedChat.map((chat) => chat.chat) } }
    //       ]
    //     })
    //       .populate('members')
    //       .populate('group')
    //       .populate('pinnedMessages')
    //       .sort({ createdAt: 'desc' })
    //       .exec()

    //     console.log('Chats:', chats)

    //     // Get all group chats by group contain user
    //     const groupChats = await Chat.aggregate([
    //       // Match chats where the group contains the specific user
    //       {
    //         $lookup: {
    //           from: 'groups', // The name of the groups collection
    //           localField: 'group',
    //           foreignField: '_id',
    //           as: 'groupInfo'
    //         }
    //       },
    //       {
    //         $unwind: '$groupInfo'
    //       },
    //       {
    //         $match: {
    //           'groupInfo.members.user': userId
    //         }
    //       }
    //     ])

    //     console.log('Group chats:', groupChats)

    //     // Merge group chats with user chats
    //     chats.push(...groupChats)

    //     // Get chat list along with last message
    //     const chatList = await Promise.all(
    //       chats.map(async (chat) => {
    //         // Find chat delete
    //         // const chatDelete = await ChatDelete.findOne({ chat: chat, user: user }).exec()
    //         // if (chatDelete) {
    //         //   return
    //         // }

    //         //const lastMessage = await Message.findOne({ chat: chat }).sort({ createdAt: 'desc' }).exec()
    //         const lastMessages = await Message.find({
    //           chat: chat,
    //           // current time is before createdAt + deleteAfter
    //           $or: [
    //             { deleteAfter: { $exists: false } },
    //             { $expr: { $gt: [{ $add: ['$createdAt', '$deleteAfter'] }, new Date()] } }
    //           ]
    //         })
    //           .sort({ createdAt: 'desc' })
    //           .limit(numberOfMessage ? numberOfMessage : 20)
    //           .populate('sender')
    //           .populate('recipient')
    //           .populate('group')
    //           .populate('group.members')
    //           .populate('group.members.user')
    //           .populate('readBy')
    //           .populate('readBy.user')
    //           .exec()

    //         // Find chat mute
    //         const chatMute = await ChatMute.findOne({ chat: chat, user: user }).exec()

    //         const chatMembers = chat.members.map((member) => ({
    //           username: member.username,
    //           displayName: member.displayName,
    //           avatar: decryptAES(member?.profilePicture?.encrypted, member?.profilePicture?.iv)
    //         }))

    //         const group = await Group.findById(chat.group)
    //           .populate('members')
    //           .populate('admin')
    //           .populate('members.user')
    //           .exec()
    //         if (group) {
    //           const chatGroupMembers = group.members.map((member) => ({
    //             username: member.user.username,
    //             displayName: member.user.displayName,
    //             avatar: decryptAES(member?.user?.profilePicture?.encrypted, member?.user?.profilePicture?.iv),
    //             lastOnline: member.user.lastOnline
    //           }))

    //           // Merge chat members and group members
    //           chatMembers.push(...chatGroupMembers)
    //         }

    //         // Find unread message count
    //         const unreadCount = await Message.countDocuments({
    //           chat: chat,
    //           sender: { $ne: user },
    //           readBy: {
    //             $not: {
    //               $elemMatch: {
    //                 user: user
    //               }
    //             }
    //           }
    //         }).exec()

    //         return {
    //           chatId: chat._id.toString(),
    //           members: chatMembers,
    //           chatGroup: {
    //             groupId: group?.id,
    //             groupName: group?.name,
    //             encryptedGroupUserKey: group?.members.find((x) => x.user.username === hashedUsername)?.key,
    //             admin: {
    //               id: group?.admin?.id,
    //               username: group?.admin?.username,
    //               displayName: group?.admin?.displayName
    //             }
    //           },
    //           isMute: chatMute ? true : false,
    //           unreadCount: unreadCount,
    //           pinnedMessages: chat.pinnedMessages.map((message) => ({
    //             messageId: message.id,
    //             sender: message.sender?.username,
    //             senderMessage: message.senderMessage,
    //             group: {
    //               groupId: message.group?.id,
    //               groupName: message.group?.name
    //             },
    //             messageType: message.messageType,
    //             createdAt: message.createdAt
    //           })),
    //           autoDelete: {
    //             isEnable: chat.autoDelete?.isEnable ?? false,
    //             time: chat.autoDelete?.time
    //           },
    //           lastMessages: lastMessages.map((message) => ({
    //             messageId: message.id,
    //             sender: {
    //               username: message.sender?.username,
    //               displayName: message.sender?.displayName
    //             },
    //             recipient: {
    //               username: message.recipient?.username,
    //               displayName: message.recipient?.displayName
    //             },
    //             senderMessage: message.senderMessage,
    //             group: {
    //               groupId: message.group?.id,
    //               groupName: message.group?.name
    //             },
    //             messageType: message.messageType,
    //             readBy: message.readBy.map((readBy) => {
    //               return {
    //                 id: readBy.user._id.toString(),
    //                 username: readBy.user.username,
    //                 displayName: readBy.user.displayName,
    //                 readAt: readBy.readAt
    //               }
    //             }),
    //             createdAt: message.createdAt
    //           }))
    //         }
    //       })
    //     )

    //     // Sort chat list by last message time, last message first
    //     chatList?.sort((a, b) => {
    //       if (a?.lastMessages[0]?.createdAt && b?.lastMessages[0]?.createdAt) {
    //         return b?.lastMessages[0]?.createdAt.getTime() - a.lastMessages[0]?.createdAt.getTime()
    //       } else if (a?.lastMessages[0]) {
    //         return 1
    //       } else if (b?.lastMessages[0]) {
    //         return -1
    //       } else {
    //         return 0
    //       }
    //     })

    //     // Send chat list to the user
    //     socket.emit('chatList', {
    //       chats: chatList
    //     })
    //   } catch (error) {
    //     console.error('Error getting chat list:', error)
    //     socket.emit('getChatListFailure')
    //   }
    // })

    // // Handle getting chat messages
    // socket.on('getChatMessages', async ({ chatId, messageId, page, pageSize }) => {
    //   try {
    //     // Fetch chat
    //     const chat = await Chat.findById(chatId).exec()

    //     if (!chat) {
    //       throw new Error('Chat not found')
    //     }

    //     // Find the latest message
    //     const latestMessage = await Message.findById(messageId).populate('sender').populate('recipient').exec()

    //     console.log('Latest message:', latestMessage)

    //     // Get the latest message time
    //     const latestMessageTime = latestMessage?.createdAt ?? new Date(0)

    //     console.log('Latest message time:', latestMessageTime)

    //     const recipientUser = latestMessage?.recipient

    //     // Fetch messages with created time newer than the last message
    //     const messages = await Message.find({
    //       chat: chat,
    //       createdAt: { $gte: latestMessageTime },
    //       // current time is before createdAt + deleteAfter
    //       $or: [
    //         { deleteAfter: null },
    //         { deleteAfter: undefined },
    //         { deleteAfter: { $exists: false } },
    //         { readBy: { $not: { $elemMatch: { user: recipientUser } } } },
    //         { $expr: { $gt: [{ $add: ['$createdAt', '$deleteAfter'] }, new Date()] } }
    //       ]
    //     })
    //       .populate('sender')
    //       .populate('recipient')
    //       .populate('readBy')
    //       .populate('readBy.user')
    //       .sort({ createdAt: 'desc' })
    //       .limit(pageSize)
    //       .skip(page * pageSize)
    //       .exec()

    //     // const paginatedMessages = messages.slice(page * pageSize, (page + 1) * pageSize)

    //     // Get message along with sender and recipient infomation
    //     const result = messages.map((message) => ({
    //       chatId: chat._id.toString(),
    //       messageId: message._id.toString(),
    //       sender: message.sender?.username,
    //       recipient: message.recipient?.username,
    //       //groupKeyEncrypted: message.groupKeyEncrypted,
    //       groupKeys: message.groupKeys.map((groupKey) => ({
    //         user: {
    //           id: groupKey.user?._id.toString(),
    //           username: groupKey.user?.username
    //         },
    //         key: groupKey.key
    //       })),
    //       senderMessage: message.senderMessage,
    //       messageType: message.messageType,
    //       readBy: message.readBy.map((readBy) => {
    //         return {
    //           id: readBy.user?._id.toString(),
    //           username: readBy.user?.username,
    //           displayName: readBy.user?.displayName,
    //           readAt: readBy.readAt
    //         }
    //       }),
    //       createdAt: message.createdAt
    //     }))

    //     console.log('Messages:', result)

    //     // Send messages to the user
    //     socket.emit('chatMessages', { chatId, messages: result, page, pageSize })
    //   } catch (error) {
    //     console.error('Error getting chat messages:', error)
    //   }
    // })

    // // Handle getting messages
    // socket.on('getMessages', async ({ user, recipient, page, pageSize }) => {
    //   try {
    //     const hashedSender = hashData(user)
    //     const senderUser = await User.findOne({ username: hashedSender }).exec()

    //     if (!senderUser) {
    //       console.log('User not found:', user)
    //       socket.emit('getMessagesFailure', 'Sender not found')
    //       return
    //     }

    //     const hashedRecipient = hashData(recipient)
    //     const recipientUser = await User.findOne({ username: hashedRecipient }).exec()

    //     if (!recipientUser) {
    //       console.log('Recipient not found:', recipient)
    //       socket.emit('getMessagesFailure', 'Recipient not found')
    //       return
    //     }

    //     // Search message by sender and recipient username
    //     const messages = await Message.find({
    //       $and: [
    //         {
    //           $or: [
    //             {
    //               sender: senderUser,
    //               recipient: recipientUser
    //             },
    //             {
    //               sender: recipientUser,
    //               recipient: senderUser
    //             }
    //           ]
    //         },
    //         // current time is before createdAt + deleteAfter
    //         {
    //           $or: [
    //             { deleteAfter: null },
    //             { deleteAfter: undefined },
    //             { deleteAfter: { $exists: false } },
    //             { readBy: { $not: { $elemMatch: { user: recipientUser } } } },
    //             { $expr: { $gt: [{ $add: ['$createdAt', '$deleteAfter'] }, new Date()] } }
    //           ]
    //         }
    //       ]
    //     })
    //       .populate('sender')
    //       .populate('recipient')
    //       .populate('readBy')
    //       .populate('readBy.user')
    //       .sort({ createdAt: 'desc' })
    //       .exec()

    //     console.log('Messages:', messages)

    //     // Paginate messages
    //     const paginatedMessages = messages.slice(page * pageSize, (page + 1) * pageSize)

    //     // Get message along with sender and recipient infomation
    //     const result = paginatedMessages.map((message) => ({
    //       messageId: message._id.toString(),
    //       sender: message.sender?.username,
    //       recipient: message.recipient?.username,
    //       senderMessage: message.senderMessage,
    //       readBy: message.readBy.map((readBy) => {
    //         return {
    //           id: readBy.user._id.toString(),
    //           username: readBy.user.username,
    //           displayName: readBy.user.displayName,
    //           readAt: readBy.readAt
    //         }
    //       }),
    //       messageType: message.messageType,
    //       createdAt: message.createdAt
    //     }))

    //     // Send messages to the user
    //     socket.emit('messages', { messages: result, page, pageSize })
    //   } catch (error) {
    //     console.log('Error getting messages:', error)
    //   }
    // })

    // // When a user reads a message, update the message's readBy field
    // socket.on('messageRead', async ({ messageIdList }: { messageIdList: string[] }) => {
    //   const user = await User.findOne({ username: username }).exec()
    //   await Message.updateMany(
    //     {
    //       _id: { $in: messageIdList }
    //     },
    //     {
    //       $addToSet: {
    //         readBy: {
    //           user: user,
    //           readAt: new Date()
    //         }
    //       }
    //     },
    //     { new: true }
    //   ).exec()

    //   const messages = await Message.find({ _id: { $in: messageIdList } })
    //     .populate('sender')
    //     .populate('recipient')
    //     .populate('group')
    //     .populate('readBy')
    //     .populate('readBy.user')
    //     .populate('chat')
    //     .sort({ createdAt: 'desc' })
    //     .exec()

    //   const sendList: string[] = []
    //   messages.forEach((message) => {
    //     if (message.group) {
    //       sendList.push(message.group._id.toString())
    //     } else {
    //       if (message.sender) {
    //         sendList.push(message.sender._id.toString())
    //       }

    //       if (message.recipient) {
    //         sendList.push(message.recipient._id.toString())
    //       }

    //       message.readBy.forEach((readBy) => {
    //         sendList.push(readBy.user._id.toString())
    //       })
    //     }
    //   })

    //   // Distinct sendList
    //   const distinctSendList = [...new Set(sendList)]

    //   console.log('Send list:', distinctSendList)

    //   distinctSendList.forEach((sendId) => {
    //     io.to(sendId).emit(
    //       'messageRead',
    //       messages.map((message) => {
    //         return {
    //           chatId: message.chat._id.toString(),
    //           messageId: message._id.toString(),
    //           readBy: message?.readBy.map((readBy) => {
    //             return {
    //               id: readBy.user._id.toString(),
    //               username: readBy.user.username,
    //               displayName: readBy.user.displayName,
    //               readAt: readBy.readAt
    //             }
    //           })
    //         }
    //       })
    //     )
    //   })
    // })

    // // Handle delete chat
    // socket.on('deleteChat', async ({ chatId }) => {
    //   try {
    //     // Find the chat
    //     const chat = await Chat.findById(chatId).populate('members').populate('group').exec()

    //     if (!chat) {
    //       socket.emit('deleteChatFailure', 'Chat not found')
    //       throw new Error('Chat not found')
    //     }

    //     // Check if user is the sender or recipient of the message
    //     if (!chat.members.find((member) => member.username === username)) {
    //       socket.emit('deleteChatFailure', 'User is not a member of the chat')
    //       throw new Error('User is not a member of the chat')
    //     }

    //     const memberUserIds = chat.members.map((member) => member.id)

    //     console.log('Member user ids:', memberUserIds)

    //     for (const member of memberUserIds) {
    //       const user = await User.findOne({ _id: member }).exec()

    //       // Save chat id to DeleteChat
    //       const chatDelete = await ChatDelete.findOne({ chatId: chat.id, user: user }).exec()
    //       if (!chatDelete) {
    //         ChatDelete.create({
    //           chatId: chat.id,
    //           user: user
    //         })
    //       }
    //     }

    //     // Delete the chat
    //     await chat.deleteOne()

    //     // Send success message to the user
    //     //socket.emit('deleteChatSuccess', chatId)
    //     for (const member of memberUserIds) {
    //       io.to(member).emit('chatDeleted', chatId)
    //     }

    //     // if group chat, send message to group
    //     if (chat.group) {
    //       const group = await Group.findById(chat.group).populate('members').exec()

    //       if (group) {
    //         for (const member of group.members) {
    //           io.to(member.user._id.toString()).emit('chatDeleted', chatId)
    //         }
    //       }
    //     }
    //   } catch (error) {
    //     console.error('Error deleting chat:', error)
    //     socket.emit('deleteChatFailure')
    //   }
    // })

    // Handle getting chat info by contact id or chat id (don't use both)
    // socket.on('getChatInfo', async ({ contactId, chatId }) => {
    //   console.log('get chat info', contactId)

    //   try {
    //     // Find user
    //     const hashedUsername = username
    //     const user = await User.findOne({ username: hashedUsername }).exec()

    //     if (!user) {
    //       throw new Error('User not found')
    //     }

    //     const contactUser = await User.findOne({ contactId: contactId }).exec()
    //     // if (!contactUser) {
    //     //   throw new Error('Contact user not found')
    //     // }

    //     // Get all chat by user except saved chat
    //     const chat = await Chat.findOne({
    //       $or: [{ members: [user, contactUser] }, { members: [contactUser, user] }, { _id: chatId }]
    //     })
    //       .populate('members')
    //       .populate('group')
    //       .populate('pinnedMessages')
    //       .sort({ createdAt: 'desc' })
    //       .exec()

    //     if (!chat) {
    //       socket.emit('getChatInfoFailure', 'Chat not found')
    //       return
    //     }

    //     //const lastMessage = await Message.findOne({ chat: chat }).sort({ createdAt: 'desc' }).exec()
    //     const lastMessages = await Message.find({
    //       chat: chat,
    //       // current time is before createdAt + deleteAfter
    //       $or: [
    //         { deleteAfter: { $exists: false } },
    //         { $expr: { $gt: [{ $add: ['$createdAt', '$deleteAfter'] }, new Date()] } }
    //       ]
    //     })
    //       .sort({ createdAt: 'desc' })
    //       .limit(20)
    //       .populate('sender')
    //       .populate('recipient')
    //       .populate('group')
    //       .populate('group.members')
    //       .populate('group.members.user')
    //       .populate('readBy')
    //       .populate('readBy.user')
    //       .exec()

    //     const chatMembers = chat.members.map((member) => ({
    //       username: member.username,
    //       displayName: member.displayName,
    //       avatar: decryptAES(member?.profilePicture?.encrypted, member?.profilePicture?.iv)
    //     }))
    //     console.log('chatMembers:', chatMembers)

    //     // Find chat mute
    //     const chatMute = await ChatMute.findOne({ chat: chat, user: user }).exec()

    //     const group = await Group.findById(chat.group)
    //       .populate('members')
    //       .populate('admin')
    //       .populate('members.user')
    //       .exec()
    //     if (group) {
    //       const chatGroupMembers = group.members.map((member) => ({
    //         username: member.user.username,
    //         displayName: member.user.displayName,
    //         avatar: decryptAES(member?.user?.profilePicture?.encrypted, member?.user?.profilePicture?.iv)
    //       }))

    //       // Merge chat members and group members
    //       chatMembers.push(...chatGroupMembers)
    //     }

    //     // Find unread message count
    //     const unreadCount = await Message.countDocuments({
    //       chat: chat,
    //       sender: { $ne: user },
    //       readBy: {
    //         $not: {
    //           $elemMatch: {
    //             user: user
    //           }
    //         }
    //       }
    //     }).exec()

    //     // Find all image messages
    //     const imageMessages = await Message.find({
    //       chat: chat,
    //       messageType: 'image',
    //       // current time is before createdAt + deleteAfter
    //       $or: [
    //         { deleteAfter: { $exists: false } },
    //         { $expr: { $gt: [{ $add: ['$createdAt', '$deleteAfter'] }, new Date()] } }
    //       ]
    //     })
    //       .sort({ createdAt: 'desc' })
    //       .limit(20)
    //       .populate('sender')
    //       .populate('recipient')
    //       .populate('group')
    //       .populate('group.members')
    //       .populate('group.members.user')
    //       .populate('readBy')
    //       .populate('readBy.user')
    //       .exec()
    //     console.log('imageMessages:', imageMessages)
    //     // Find all call made by user
    //     const calls = await Call.find({
    //       $or: [{ caller: user }, { callee: user }]
    //     })
    //       .sort({ createdAt: 'desc' })
    //       .limit(20)
    //       .populate('caller')
    //       .populate('callee')
    //       .exec()
    //     console.log('calls:', calls)

    //     const data = {
    //       chatId: chat._id.toString(),
    //       members: chatMembers,
    //       chatGroup: {
    //         groupId: group?.id,
    //         groupName: group?.name,
    //         encryptedGroupUserKey: group?.members.find((x) => x.user.username === hashedUsername)?.key,
    //         admin: {
    //           id: group?.admin?.id,
    //           username: group?.admin?.username,
    //           displayName: group?.admin?.displayName
    //         }
    //       },
    //       isMute: chatMute ? true : false,
    //       unreadCount: unreadCount,
    //       pinnedMessages: chat.pinnedMessages.map((message) => ({
    //         messageId: message.id,
    //         sender: message.sender?.username,
    //         senderMessage: message.senderMessage,
    //         group: {
    //           groupId: message.group?.id,
    //           groupName: message.group?.name
    //         },
    //         messageType: message.messageType,
    //         createdAt: message.createdAt
    //       })),
    //       autoDelete: {
    //         isEnable: chat.autoDelete?.isEnable ?? false,
    //         time: chat.autoDelete?.time
    //       },
    //       calls: calls.map((call) => ({
    //         callId: call.id,
    //         caller: {
    //           username: call.caller.username,
    //           displayName: call.caller.displayName
    //         },
    //         callee: {
    //           username: call.callee.username,
    //           displayName: call.callee.displayName
    //         },
    //         callType: call.type,
    //         callStatus: call.status,
    //         callDuration: call.duration ? call.duration : 0,
    //         createdAt: call.createdAt
    //       })),
    //       lastMessages: lastMessages.map((message) => ({
    //         messageId: message.id,
    //         sender: {
    //           username: message.sender?.username,
    //           displayName: message.sender?.displayName
    //         },
    //         recipient: {
    //           username: message.recipient?.username,
    //           displayName: message.recipient?.displayName
    //         },
    //         senderMessage: message.senderMessage,
    //         group: {
    //           groupId: message.group?.id,
    //           groupName: message.group?.name
    //         },
    //         messageType: message.messageType,
    //         readBy: message.readBy.map((readBy) => {
    //           return {
    //             id: readBy.user._id.toString(),
    //             username: readBy.user.username,
    //             displayName: readBy.user.displayName,
    //             readAt: readBy.readAt
    //           }
    //         }),
    //         createdAt: message.createdAt
    //       })),
    //       imageMessages: imageMessages.map((message) => ({
    //         messageId: message.id,
    //         sender: {
    //           username: message.sender?.username,
    //           displayName: message.sender?.displayName
    //         },
    //         recipient: {
    //           username: message.recipient?.username,
    //           displayName: message.recipient?.displayName
    //         },
    //         senderMessage: message.senderMessage,
    //         group: {
    //           groupId: message.group?.id,
    //           groupName: message.group?.name
    //         },
    //         messageType: message.messageType,
    //         readBy: message.readBy.map((readBy) => {
    //           return {
    //             id: readBy.user._id.toString(),
    //             username: readBy.user.username,
    //             displayName: readBy.user.displayName,
    //             readAt: readBy.readAt
    //           }
    //         }),
    //         createdAt: message.createdAt
    //       }))
    //     }
    //     console.log('emit chat info', data)
    //     // Send chat list to the user
    //     socket.emit('chatInfo', data)
    //   } catch (error) {
    //     console.error('Error getting chat list:', error)
    //     socket.emit('getChatInfoFailure')
    //   }
    // })
  })
}
