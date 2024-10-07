import { Request, Response } from 'express'
import { ReasonPhrases, StatusCodes } from 'http-status-codes'
import winston from 'winston'
import { GetPrivateMessagePayload } from '~/contracts/message'
import { ICombinedRequest, IUserRequest } from '~/contracts/request'
import { messageService } from '~/services'

type GetPublicMessage = Request<any, any, any, { page: number; limit: number }>

export async function getMessageById(
  {
    context: { user },
    params: { id }
  }: ICombinedRequest<IUserRequest, unknown, GetPrivateMessagePayload, unknown>,
  res: Response
) {
  try {
    const messages = await messageService.getById(id, user.id)
    return res.status(StatusCodes.OK).json({
      data: messages,
      message: ReasonPhrases.OK,
      status: StatusCodes.OK
    })
  } catch (error) {
    winston.error(error)

    return res.status(StatusCodes.BAD_REQUEST).json({
      message: ReasonPhrases.BAD_REQUEST,
      status: StatusCodes.BAD_REQUEST
    })
  }
}

export const getPublicMessages = async (
  req: GetPublicMessage,
  res: Response
) => {
  try {
    const { docs, page, totalPages } = await messageService.getPublicMessages(
      req.query.page,
      req.query.limit
    )
    // res.json(messages)
    return res.status(StatusCodes.OK).json({
      data: { docs, page, totalPages },
      message: ReasonPhrases.OK,
      status: StatusCodes.OK
    })
  } catch (error) {
    console.log(error)

    winston.error(error)
    return res.status(StatusCodes.BAD_REQUEST).json({
      message: ReasonPhrases.BAD_REQUEST,
      status: StatusCodes.BAD_REQUEST
    })
  }
}
