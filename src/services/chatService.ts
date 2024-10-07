import { ObjectId } from 'mongoose'
import { IChat } from '~/contracts/chat'
import Chat from '~/models/Chat'

const create = async (members: ObjectId[]) => {
  const chat = new Chat({ members })
  const saved = await chat.save()
  // Populate members
  const populated = await saved.populate('members')
  return populated
}

const getAll = async (userId: ObjectId): Promise<IChat[]> => {
  return await Chat.find({ members: { $in: [userId] } })
    .populate('members')
    .exec()
}

export const chatService = {
  getAll,
  create
}
