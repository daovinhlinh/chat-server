import moment from 'moment'
import { ClientSession, ObjectId } from 'mongoose'
import { ICheckIn } from '~/contracts/checkin'
import { CheckIn } from '~/models/CheckIn'
import RollDice from '~/models/RollDice'
import { TaiXiuUser } from '~/models/TaiXiu_user'
import { User } from '~/models/User'
import { paginate } from '~/utils/paging'
import { userService } from './userService'

const createRoll = (user: ObjectId, result: boolean, coins: number) => {
  return new RollDice({ user, result, coins }).save()
}

// Add Check-in
const checkIn = (user: ObjectId, coins: number, session?: ClientSession) => {
  return new CheckIn({ user, coins }).save({ session })
}

// Check if user has checked in today
const isCheckInToday = async (user: ObjectId) => {
  const now = new Date()
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const endOfDay = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    23,
    59,
    59,
    999
  )

  const existingCheckIn = await CheckIn.findOne({
    user,
    createdAt: { $gte: startOfDay, $lte: endOfDay }
  })

  return Boolean(existingCheckIn)
}

// Get check-in history
const getCheckInHistory = async (
  user: ObjectId | undefined,
  fromDate: Date | null,
  toDate: Date | null,
  page: number = 1,
  limit: number = 20
) => {
  const query: any = {}
  if (user) query.user = user
  if (fromDate || toDate) query.createdAt = {}
  if (fromDate) query.createdAt.$gte = fromDate
  if (toDate) query.createdAt.$lte = moment(toDate).endOf('day').toDate() // End of day

  const {
    docs,
    page: currentPage,
    totalPages
  } = await paginate<ICheckIn>(CheckIn, query, { page, limit })

  return {
    docs,
    page: currentPage,
    totalPages
  }
}

// Update user's coin
const updateCoin = async (
  userId: ObjectId,
  coins: number,
  session?: ClientSession
) => {
  // Block if user has insufficient coins
  const currentCoins = await User.findById(userId).select('coins')

  if (!currentCoins) {
    throw new Error('User not found')
  }

  if (coins < 0) {
    throw new Error('Insufficient coins')
  }

  return await User.findByIdAndUpdate(userId, { coins }, { new: true, session })
}

// Update user's coin
const addCoin = async (
  userId: ObjectId,
  coins: number,
  session?: ClientSession
) => {
  // Block if user has insufficient coins
  const currentCoins = await User.findById(userId).select('coins')

  if (!currentCoins) {
    throw new Error('User not found')
  }

  if (currentCoins.coins + coins < 0) {
    throw new Error('Insufficient coins')
  }

  return await User.findByIdAndUpdate(
    userId,
    { $inc: { coins } },
    { new: true, session }
  )
}

// Get user ranking base on coins
const getCoinsRanking = async (limit: number = 10) => {
  // return await User.find({ role: 'user' })
  //   .sort({ coins: -1 })
  //   .limit(limit)
  //   .select('username email coins')

  // try {
  //   const results = await TaiXiuUser.find({ total: { $gt: 0 } }, 'total uid', {
  //     sort: { total: -1 },
  //     limit
  //   }).exec()
  //   return results
  // } catch (err) {
  //   console.error('Error in GetTop:', err)
  // }

  try {
    const bot = await User.find({ username: /nohu/ }, '_id').exec()

    const arraybot = bot.map(str => str._id.toString())

    const results = await TaiXiuUser.find(
      { $and: [{ uid: { $nin: arraybot } }, { total: { $gt: 0 } }] },
      'total uid',
      {
        sort: { total: -1 },
        limit
      }
    ).exec()
    return results
  } catch (err) {
    console.error('Error in GetTop:', err)
  }
}

export const gameService = {
  createRoll,
  checkIn,
  isCheckInToday,
  getCheckInHistory,
  updateCoin,
  getCoinsRanking,
  addCoin
}
