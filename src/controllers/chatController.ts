import { Request, Response } from 'express'
import { IRequestWithUser } from '~/middlewares/authentication'
import * as chatService from '../services/chatService'

export const getAllChat = async (req: IRequestWithUser, res: Response) => {
  try {
    if (req.user) {
      const chats = await chatService.getAll(req.user?.username)

      console.log(chats)
      res.json(chats)
    }
  } catch (error) {
    console.error(error)
    // res.status(500).json({ message: 'Internal server error' })
  }
}
