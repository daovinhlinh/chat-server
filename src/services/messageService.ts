import { IPrivateMessage, IPublicMessage } from '~/contracts/message'
import Message from '../models/PrivateMessage'
import PublicMessage from '../models/PublicMessage'

const getById = async (chatId: string): Promise<IPrivateMessage[]> => {
  return await Message.find({ chat: chatId }).sort({ createdAt: 'asc' }).exec()
}

const getPublicMessages = async (
  page: number = 1,
  limit: number = 50
): Promise<IPublicMessage[]> => {
  const skip = (page - 1) * limit

  return await PublicMessage.find({})
    .sort({ createdAt: 'asc' })
    .skip(skip)
    .limit(limit)
    .populate('sender') // Populate after limit and skip
    .exec()
}

export const messageService = {
  getById,
  getPublicMessages
}
