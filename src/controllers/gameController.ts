import { Response } from 'express'
import { ReasonPhrases, StatusCodes } from 'http-status-codes'
import { isValidObjectId, startSession } from 'mongoose'
import winston from 'winston'
import { CustomReasonPhrases, RollResultType } from '~/constants'
import { GetCheckInHistoryPayload } from '~/contracts/checkin'
import { IRollDice, RollDicePayload, UpdateCoinPayload } from '~/contracts/game'
import {
  IBodyRequest,
  ICombinedRequest,
  IContextRequest,
  IUserRequest
} from '~/contracts/request'
import { userService } from '~/services'
import { gameService } from '~/services/gameService'
import { convertStringToDate } from '~/utils/dates'
import { randomNumberInRange } from '~/utils/number'

// #region Roll Dice
const getResult = (
  totalOverBet: number,
  totalUnderBet: number,
  numDice: number,
  maxUnderPoint: number
): number[] => {
  return getResultByType(
    randomResultType(totalOverBet, totalUnderBet),
    numDice,
    maxUnderPoint
  )
}

const randomResultType = (
  totalOverBet: number,
  totalUnderBet: number
): RollResultType => {
  return totalOverBet > totalUnderBet
    ? RollResultType.Under
    : RollResultType.Over
}

const getResultByType = (
  type: RollResultType,
  numDice: number = 3,
  maxUnderPoint: number = 10
): number[] => {
  const result: number[] = []

  // Depending on the result type (Over or Under), calculate rndPoint
  let rndPoint: number
  if (type === RollResultType.Over) {
    rndPoint = randomNumberInRange(maxUnderPoint + 1, numDice * 6 + 1)
  } else {
    rndPoint = randomNumberInRange(numDice, maxUnderPoint + 1)
  }

  let currentSum = 0

  // Calculate each dice result
  for (let i = 0; i < numDice; i++) {
    const maxValue = Math.min(6, rndPoint - currentSum - (numDice - i - 1))
    const minValue = Math.max(1, rndPoint - currentSum - 6 * (numDice - i - 1))
    const rndValue = randomNumberInRange(minValue, maxValue + 1)

    result.push(rndValue)
    currentSum += rndValue
  }

  return result
}

const rollDice = ({ body }: IBodyRequest<RollDicePayload>) => {
  const { totalOverBet, maxUnderPoint, numDice, totalUnderBet } = body

  const result = getResult(totalOverBet, totalUnderBet, numDice, maxUnderPoint)

  return result
}

// #endregion
// User checkin
const checkIn = async (
  { context: { user } }: IContextRequest<IUserRequest>,
  res: Response
) => {
  const session = await startSession()
  const coinAmount = 100

  try {
    const isCheckedIn = await gameService.isCheckInToday(user.id)

    if (isCheckedIn) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        message: CustomReasonPhrases.ALREADY_CHECKED_IN,
        status: StatusCodes.BAD_REQUEST
      })
    }

    const checkInUser = await userService.getById(user.id)

    if (!checkInUser) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        message: ReasonPhrases.BAD_REQUEST,
        status: StatusCodes.BAD_REQUEST
      })
    }

    session.startTransaction()

    const results = await Promise.allSettled([
      gameService.checkIn(user.id, session),
      gameService.updateCoin(user.id, coinAmount, session)
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

// Get ranking by coins
const getRanking = async (_: IContextRequest<IUserRequest>, res: Response) => {
  try {
    const rank = await gameService.getCoinsRanking()
    return res.status(StatusCodes.OK).json({
      data: rank,
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

const updateCoin = async (
  {
    context,
    body: { userId, coins }
  }: ICombinedRequest<IUserRequest, UpdateCoinPayload>,
  res: Response
) => {
  try {
    const parsedCoins = Number(coins)
    console.log(typeof coins)

    // Check if coins is valid number: allow negative number, int number
    if (
      (!Number.isInteger(parsedCoins) && coins.trim() !== '') ||
      !isValidObjectId(userId)
    ) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        message: ReasonPhrases.BAD_REQUEST,
        status: StatusCodes.BAD_REQUEST
      })
    }

    await gameService.updateCoin(userId, parsedCoins)

    return res.status(StatusCodes.OK).json({
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

export const gameController = {
  rollDice,
  checkIn,
  getCheckInHistory,
  getRanking,
  updateCoin
}
