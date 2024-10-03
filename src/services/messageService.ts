import Message, { IPrivateMessage } from '../models/PrivateMessage'
import PublicMessage, { IPublicMessage } from '../models/PublicMessage'

export async function getById(chatId: string): Promise<IPrivateMessage[]> {
  return await Message.find({ chat: chatId }).sort({ createdAt: 'asc' }).exec()
}

export const getPublicMessages = async (page: number = 1, limit: number = 50): Promise<IPublicMessage[]> => {
  const skip = (page - 1) * limit

  return await PublicMessage.find({}).sort({ createdAt: 'asc' }).skip(skip).limit(limit).exec()
}

// export async function addMessage(text: string): Promise<IMessage> {
//   const message = new Message({ text })
//   return await message.save()
// }
