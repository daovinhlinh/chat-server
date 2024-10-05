import { Request, Response } from 'express'
import { ReasonPhrases, StatusCodes } from 'http-status-codes'
import { IContextRequest, IUserRequest } from '~/contracts/request'
import { chatService } from '~/services/chatService'

export const chatController = {
  getAllChat: async (
    { context: { user } }: IContextRequest<IUserRequest>,
    res: Response
  ) => {
    if (!user) {
      return res.status(StatusCodes.NOT_FOUND).json({
        message: ReasonPhrases.NOT_FOUND,
        status: StatusCodes.NOT_FOUND
      })
    }

    const chats = await chatService.getAll(user.username)

    return res.status(StatusCodes.OK).json({
      data: chats,
      message: ReasonPhrases.OK,
      status: StatusCodes.OK
    })
  }
}
