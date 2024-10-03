import Message, { IPrivateMessage } from '../models/PrivateMessage'

export async function getById(chatId: string): Promise<IPrivateMessage[]> {
  return await Message.find({ chat: chatId }).sort({ createdAt: 'asc' }).exec()
}

// export async function addMessage(text: string): Promise<IMessage> {
//   const message = new Message({ text })
//   return await message.save()
// }
