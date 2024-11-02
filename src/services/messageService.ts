import { Document, ObjectId } from 'mongoose'
import { IPrivateMessage, IPublicMessage } from '~/contracts/message'
import { paginate } from '~/utils/paging'
import Message from '../models/PrivateMessage'
import PublicMessage from '../models/PublicMessage'

const getById = async (
  chatId: ObjectId,
  userId: ObjectId
): Promise<IPrivateMessage[]> => {
  return await Message.find({
    chat: chatId,
    $or: [{ sender: userId }, { recipient: userId }] // Find messages sent or received by the user
  })
    .populate('sender')
    .populate('recipient')
    .sort({ createdAt: 'asc' })
    .exec()
}

const getPublicMessages = async (page: number = 1, limit: number = 50) => {
  const skip = (page - 1) * limit

  const [docs, totalDocs] = await Promise.all([
    PublicMessage.find({})
      .sort({ createdAt: 'desc' })
      .skip(skip)
      .limit(limit)
      .populate('sender'), // Populate after limit and skip
    PublicMessage.countDocuments({})
  ])

  const totalPages = Math.ceil(totalDocs / limit)

  return {
    docs,
    page,
    totalPages
  }
}

export const messageService = {
  getById,
  getPublicMessages
}
