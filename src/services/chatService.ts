import Chat, { IChat } from '~/models/Chat'

export const getAll = async (username: string): Promise<IChat[]> => {
  return await Chat.find({ members: { $in: [username] } }).exec()
}
