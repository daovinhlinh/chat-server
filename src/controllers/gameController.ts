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
import { ITopUser } from '~/contracts/taixiu'
import { User } from '~/models/User'
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

// Get ranking by coins
const getRanking = async (_: IContextRequest<IUserRequest>, res: Response) => {
  try {
    const list = await gameService.getCoinsRanking()
    if (!list) {
      return res.status(StatusCodes.OK).json({
        data: [],
        message: ReasonPhrases.OK,
        status: StatusCodes.OK
      })
    }

    const topUsers: ITopUser[] = await Promise.all(
      list.map(async obj => {
        const result2 = await User.findOne({ id: obj.uid }).exec()
        return {
          name: result2 ? result2.username : '',
          bet: obj.total
          // type: result2 ? result2.type : false
        }
      })
    )

    return res.status(StatusCodes.OK).json({
      data: topUsers,
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

    const newData = await gameService.updateCoin(userId, parsedCoins)

    return res.status(StatusCodes.OK).json({
      data: newData,
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
  getRanking,
  updateCoin
}
