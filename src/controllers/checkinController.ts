import { Response } from 'express'
import { ReasonPhrases, StatusCodes } from 'http-status-codes'
import { startSession } from 'mongoose'
import winston from 'winston'
import { CustomReasonPhrases } from '~/constants'
import { GetCheckInHistoryPayload } from '~/contracts/checkin'
import {
  AddCheckInSpecialDayPayload,
  UpdateCheckInCoinPayload,
  UpdateCheckInSpecialDayPayload
} from '~/contracts/checkinConfig'
import {
  IBodyRequest,
  ICombinedRequest,
  IContextRequest,
  IUserRequest
} from '~/contracts/request'
import { userService } from '~/services'
import { checkinService } from '~/services/checkinService'
import { gameService } from '~/services/gameService'
import { convertStringToDate } from '~/utils/dates'

// User checkin
const checkIn = async (
  { context: { user } }: IContextRequest<IUserRequest>,
  res: Response
) => {
  const session = await startSession()

  try {
    // Check if user was already checked in today
    const isCheckedIn = await gameService.isCheckInToday(user.id)

    if (isCheckedIn) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        message: CustomReasonPhrases.ALREADY_CHECKED_IN,
        status: StatusCodes.BAD_REQUEST
      })
    }

    // Check if user is existed
    const checkInUser = await userService.getById(user.id)

    if (!checkInUser) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        message: ReasonPhrases.BAD_REQUEST,
        status: StatusCodes.BAD_REQUEST
      })
    }

    session.startTransaction()

    // Get check in coins amount
    const rewardAmount = await checkinService.getCheckInReward()

    if (!rewardAmount) {
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        message: ReasonPhrases.INTERNAL_SERVER_ERROR,
        status: StatusCodes.INTERNAL_SERVER_ERROR
      })
    }

    const results = await Promise.allSettled([
      gameService.checkIn(user.id, rewardAmount, session),
      gameService.addCoin(user.id, rewardAmount, session)
    ])

    const errors = results.filter(result => result.status === 'rejected')

    if (errors.length) {
      if (session.inTransaction()) {
        await session.abortTransaction()
        session.endSession()
      }

      return res.status(StatusCodes.BAD_REQUEST).json({
        message: ReasonPhrases.BAD_REQUEST,
        status: StatusCodes.BAD_REQUEST
      })
    }

    await session.commitTransaction()
    session.endSession()

    return res.status(StatusCodes.OK).json({
      data: {
        coins: results[1].status === 'fulfilled' ? results[1].value?.coins : 0
      },
      message: ReasonPhrases.OK,
      status: StatusCodes.OK
    })
  } catch (error) {
    winston.error(error)

    if (session.inTransaction()) {
      await session.abortTransaction()
      session.endSession()
    }

    return res.status(StatusCodes.BAD_REQUEST).json({
      message: ReasonPhrases.BAD_REQUEST,
      status: StatusCodes.BAD_REQUEST
    })
  }
}

// Get check-in history
const getCheckInHistory = async (
  {
    context: {
      user: { role, id }
    },
    query: { user, fromDate, toDate, page = 1, limit = 20 }
  }: ICombinedRequest<IUserRequest, unknown, unknown, GetCheckInHistoryPayload>,
  res: Response
) => {
  const fromDateFormatted = convertStringToDate(fromDate, 'DDMMYYYY')

  const toDateFormat = convertStringToDate(toDate, 'DDMMYYYY')

  // check if fromDate is greater than toDate
  if (fromDateFormatted && toDateFormat && fromDateFormatted > toDateFormat) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      message: ReasonPhrases.BAD_REQUEST,
      status: StatusCodes.BAD_REQUEST
    })
  }

  const checkInHistory = await gameService.getCheckInHistory(
    role === 'admin' ? user : id, // Only admin can view other user's check-in history
    fromDateFormatted,
    toDateFormat,
    page,
    limit
  )

  return res.status(StatusCodes.OK).json({
    data: checkInHistory,
    message: ReasonPhrases.OK,
    status: StatusCodes.OK
  })
}

const getCheckInConfig = async (
  req: IContextRequest<IUserRequest>,
  res: Response
) => {
  try {
    const config = await checkinService.getConfig()
    if (config) {
      return res.status(StatusCodes.OK).json({
        data: config,
        message: ReasonPhrases.OK,
        status: StatusCodes.OK
      })
    } else {
      // Create new config if no config found
      const newConfig = await checkinService.addConfig(1000)

      if (!newConfig) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          message: ReasonPhrases.BAD_REQUEST,
          status: StatusCodes.BAD_REQUEST
        })
      }

      const config = await checkinService.getConfig()
      if (config) {
        return res.status(StatusCodes.OK).json({
          data: config,
          message: ReasonPhrases.OK,
          status: StatusCodes.OK
        })
      }

      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        message: ReasonPhrases.INTERNAL_SERVER_ERROR,
        status: StatusCodes.INTERNAL_SERVER_ERROR
      })
    }
  } catch (error) {
    winston.error(error)

    return res.status(StatusCodes.BAD_REQUEST).json({
      message: ReasonPhrases.BAD_REQUEST,
      status: StatusCodes.BAD_REQUEST
    })
  }
}

const addSpecialDay = async (
  { body: { coins, date } }: IBodyRequest<AddCheckInSpecialDayPayload>,
  res: Response
) => {
  try {
    const dateFormatted = convertStringToDate(date, 'YYYY-MM-DD')

    if (!dateFormatted) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        message: ReasonPhrases.BAD_REQUEST,
        status: StatusCodes.BAD_REQUEST
      })
    }

    const isExisted = await checkinService.isSpecialDay(dateFormatted)

    if (isExisted) {
      return res.status(StatusCodes.CONFLICT).json({
        message: CustomReasonPhrases.DAY_IS_EXISTED,
        status: StatusCodes.CONFLICT
      })
    }

    const newConfig = await checkinService.addSpecialDay(
      dateFormatted,
      Number(coins)
    )

    if (newConfig) {
      return res.status(StatusCodes.OK).json({
        data: newConfig,
        message: ReasonPhrases.OK,
        status: StatusCodes.OK
      })
    }

    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: ReasonPhrases.INTERNAL_SERVER_ERROR,
      status: StatusCodes.INTERNAL_SERVER_ERROR
    })
  } catch (error) {
    winston.error(error)

    return res.status(StatusCodes.BAD_REQUEST).json({
      message: ReasonPhrases.BAD_REQUEST,
      status: StatusCodes.BAD_REQUEST
    })
  }
}

const updateCheckInCoin = async (
  { body: { coins } }: IBodyRequest<UpdateCheckInCoinPayload>,
  res: Response
) => {
  try {
    const newConfig = await checkinService.updateDefaultCoin(Number(coins))

    if (newConfig) {
      return res.status(StatusCodes.OK).json({
        data: newConfig,
        message: ReasonPhrases.OK,
        status: StatusCodes.OK
      })
    }
  } catch (error) {
    winston.error(error)

    return res.status(StatusCodes.BAD_REQUEST).json({
      message: ReasonPhrases.BAD_REQUEST,
      status: StatusCodes.BAD_REQUEST
    })
  }
}

const updateSpecialDay = async (
  { body: { id, coins } }: IBodyRequest<UpdateCheckInSpecialDayPayload>,
  res: Response
) => {
  try {
    const newConfig = await checkinService.updateSpecialDay(id, Number(coins))

    if (newConfig) {
      return res.status(StatusCodes.OK).json({
        data: newConfig,
        message: ReasonPhrases.OK,
        status: StatusCodes.OK
      })
    }

    return res.status(StatusCodes.BAD_REQUEST).json({
      message: ReasonPhrases.BAD_REQUEST,
      status: StatusCodes.BAD_REQUEST
    })
  } catch (error) {
    winston.error(error)

    return res.status(StatusCodes.BAD_REQUEST).json({
      message: ReasonPhrases.BAD_REQUEST,
      status: StatusCodes.BAD_REQUEST
    })
  }
}

const deleteSpecialDay = async (
  { body: { id } }: IBodyRequest<UpdateCheckInSpecialDayPayload>,
  res: Response
) => {
  try {
    const newConfig = await checkinService.deleteSpecialDay(id)

    if (newConfig) {
      return res.status(StatusCodes.OK).json({
        data: newConfig,
        message: ReasonPhrases.OK,
        status: StatusCodes.OK
      })
    }

    return res.status(StatusCodes.BAD_REQUEST).json({
      message: ReasonPhrases.BAD_REQUEST,
      status: StatusCodes.BAD_REQUEST
    })
  } catch (error) {
    winston.error(error)

    return res.status(StatusCodes.BAD_REQUEST).json({
      message: ReasonPhrases.BAD_REQUEST,
      status: StatusCodes.BAD_REQUEST
    })
  }
}

export const checkinController = {
  checkIn,
  getCheckInHistory,
  addSpecialDay,
  getCheckInConfig,
  updateCheckInCoin,
  updateSpecialDay,
  deleteSpecialDay
}
