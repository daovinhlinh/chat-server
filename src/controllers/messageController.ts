import { Request, Response } from 'express'
import * as messageService from '../services/messageService'

type GetMessageByIdRequest = Request<{ id: string }, any, any, any>

export async function getMessageById(req: GetMessageByIdRequest, res: Response): Promise<void> {
  console.log('getMessageById', req.params.id)

  try {
    const messages = await messageService.getById(req.params.id)
    res.json(messages)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Internal server error' })
  }
}

// export async function createMessage(req: Request, res: Response): Promise<void> {
//   try {
//     const { text } = req.body
//     const message = await messageService.addMessage(text)
//     res.status(201).json(message)
//   } catch (error) {
//     console.error(error)
//     res.status(500).json({ message: 'Internal server error' })
//   }
// }
