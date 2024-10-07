import { ReasonPhrases, StatusCodes } from 'http-status-codes'
import { GetCheckInHistoryPayload } from '~/contracts/checkin'
import { ICombinedRequest, IUserRequest } from '~/contracts/request'
import { NextFunction, Response } from 'express'
import winston from 'winston'
import { isValidObjectId } from 'mongoose'

const getCheckInHistory = (
  {
    context: {
      user: { role }
    },
    query: { user }
  }: ICombinedRequest<IUserRequest, unknown, unknown, GetCheckInHistoryPayload>,
  res: Response,
  next: NextFunction
) => {
  try {
    if (role !== 'admin' && user) {
      return res.status(StatusCodes.FORBIDDEN).json({
        message: ReasonPhrases.FORBIDDEN,
        status: StatusCodes.FORBIDDEN
      })
    }

    if (role === 'admin' && user && !isValidObjectId(user)) {
      return res.status(StatusCodes.NOT_FOUND).json({
        message: ReasonPhrases.NOT_FOUND,
        status: StatusCodes.NOT_FOUND
      })
    }

    return next()
  } catch (error) {
    winston.error(error)

    return res.status(StatusCodes.BAD_REQUEST).json({
      message: ReasonPhrases.BAD_REQUEST,
      status: StatusCodes.BAD_REQUEST
    })
  }
}

export const gameValidation = {
  getCheckInHistory
}
