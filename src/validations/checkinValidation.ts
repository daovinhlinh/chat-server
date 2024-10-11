import { ReasonPhrases, StatusCodes } from 'http-status-codes'
import { GetCheckInHistoryPayload } from '~/contracts/checkin'
import {
  ICombinedRequest,
  IUserRequest,
  IBodyRequest
} from '~/contracts/request'
import { NextFunction, Response } from 'express'
import winston from 'winston'
import { isValidObjectId } from 'mongoose'
import { isValidSpecicalDay } from '~/utils/dates'
import { isValidNumberString } from '~/utils/number'
import {
  AddCheckInSpecialDayPayload,
  DeleteCheckInSpecialDayPayload,
  UpdateCheckInCoinPayload,
  UpdateCheckInSpecialDayPayload
} from '~/contracts/checkinConfig'

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

const addSpecialDay = (
  { body }: IBodyRequest<AddCheckInSpecialDayPayload>,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!body) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        message: ReasonPhrases.BAD_REQUEST,
        status: StatusCodes.BAD_REQUEST
      })
    }

    const { coins, date } = body

    if (
      !coins ||
      !isValidNumberString(coins) ||
      !date ||
      !isValidSpecicalDay(date)
    ) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        message: ReasonPhrases.BAD_REQUEST,
        status: StatusCodes.BAD_REQUEST
      })
    }

    if (Number(coins) < 0) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        message: ReasonPhrases.BAD_REQUEST,
        status: StatusCodes.BAD_REQUEST
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

const updateSpecialDay = (
  { body }: IBodyRequest<UpdateCheckInSpecialDayPayload>,
  res: Response,
  next: NextFunction
) => {
  try {
    if (
      !body ||
      (body && !body.coins) ||
      !isValidNumberString(body.coins) ||
      !isValidObjectId(body.id)
    ) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        message: ReasonPhrases.BAD_REQUEST,
        status: StatusCodes.BAD_REQUEST
      })
    }

    //Check if coins is negative
    if (Number(body.coins) < 0) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        message: ReasonPhrases.BAD_REQUEST,
        status: StatusCodes.BAD_REQUEST
      })
    }

    next()
  } catch (error) {
    winston.error(error)

    return res.status(StatusCodes.BAD_REQUEST).json({
      message: ReasonPhrases.BAD_REQUEST,
      status: StatusCodes.BAD_REQUEST
    })
  }
}

const updateCheckInCoin = (
  { body }: IBodyRequest<UpdateCheckInCoinPayload>,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!body || (body && !body.coins) || !isValidNumberString(body.coins)) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        message: ReasonPhrases.BAD_REQUEST,
        status: StatusCodes.BAD_REQUEST
      })
    }

    //Check if coins is negative
    if (Number(body.coins) < 0) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        message: ReasonPhrases.BAD_REQUEST,
        status: StatusCodes.BAD_REQUEST
      })
    }

    next()
  } catch (error) {
    winston.error(error)

    return res.status(StatusCodes.BAD_REQUEST).json({
      message: ReasonPhrases.BAD_REQUEST,
      status: StatusCodes.BAD_REQUEST
    })
  }
}

const deleteSpecialDay = (
  { body }: IBodyRequest<DeleteCheckInSpecialDayPayload>,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!body || (body && !isValidObjectId(body.id))) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        message: ReasonPhrases.BAD_REQUEST,
        status: StatusCodes.BAD_REQUEST
      })
    }

    next()
  } catch (error) {
    winston.error(error)

    return res.status(StatusCodes.BAD_REQUEST).json({
      message: ReasonPhrases.BAD_REQUEST,
      status: StatusCodes.BAD_REQUEST
    })
  }
}

export const checkinValidation = {
  getCheckInHistory,
  addSpecialDay,
  updateCheckInCoin,
  updateSpecialDay,
  deleteSpecialDay
}
