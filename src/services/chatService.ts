import { IChat } from '~/contracts/chat'
import Chat from '~/models/Chat'

const create = async (members: string[]) => {
  const chat = new Chat({ members })
  const saved = await chat.save()
  return saved
}

const getAll = async (username: string): Promise<IChat[]> => {
  return await Chat.find({ members: { $in: [username] } }).exec()
}

export const chatService = {
  getAll,
  create
}
