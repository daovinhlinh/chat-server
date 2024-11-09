import { ObjectId, Types } from 'mongoose'
import { CheckInConfig } from '~/models/CheckInConfig'

const addConfig = async (coins: number) => {
  const checkin = new CheckInConfig({ defaultCoins: coins })

  await checkin.save()

  return checkin
}

const getConfig = async () => {
  const checkin = await CheckInConfig.findOne()

  return checkin
}

const getCheckInReward = async () => {
  const specialDay = await isSpecialDay(new Date())

  if (specialDay) {
    return specialDay.coins
  }

  const config = await getConfig()

  if (config) {
    return config.defaultCoins
  }

  return null
}

const updateDefaultCoin = async (coin: number) => {
  const checkin = await CheckInConfig.findOneAndUpdate(
    {},
    { $set: { defaultCoins: coin } },
    { new: true }
  )

  return checkin
}

const addSpecialDay = async (date: Date, coins: number) => {
  const checkin = await CheckInConfig.findOneAndUpdate(
    {},
    { $push: { specialDays: { date, coins } } },
    { new: true }
  )

  if (checkin) {
    // Find the newly added special day in the updated document
    const newSpecialDay = checkin.specialDays.find(
      specialDay =>
        specialDay.date.getTime() === date.getTime() &&
        specialDay.coins === coins
    )

    return newSpecialDay
  }

  return checkin
}

const isSpecialDay = async (date: Date) => {
  const checkin = await CheckInConfig.findOne({
    specialDays: {
      $elemMatch: {
        date: {
          $gte: new Date(date.setHours(0, 0, 0, 0)),
          $lt: new Date(date.setHours(23, 59, 59, 999))
        }
      }
    }
  })

  if (!checkin || !checkin.specialDays.length) {
    return null
  }

  // Find the matching special day
  const specialDay = checkin.specialDays.find(day => {
    const dayDate = new Date(day.date)
    return (
      dayDate.getUTCFullYear() === date.getUTCFullYear() &&
      dayDate.getUTCMonth() === date.getUTCMonth() &&
      dayDate.getUTCDate() === date.getUTCDate()
    )
  })

  return specialDay || null
}

const updateSpecialDay = async (id: ObjectId, coins: number) => {
  const checkin = await CheckInConfig.findOneAndUpdate(
    { specialDays: { $elemMatch: { _id: id } } },
    { $set: { 'specialDays.$.coins': coins } },
    { new: true }
  )

  return checkin
}

const deleteSpecialDay = async (id: ObjectId) => {
  const checkin = await CheckInConfig.findOneAndUpdate(
    {},
    { $pull: { specialDays: { _id: id } } },
    { new: true }
  )

  if (
    !checkin ||
    checkin.specialDays.some(day =>
      (day._id as unknown as Types.ObjectId).equals(
        new Types.ObjectId(id as unknown as string)
      )
    )
  ) {
    return null
  }

  return checkin
}

export const checkinService = {
  addConfig,
  getConfig,
  updateDefaultCoin,
  addSpecialDay,
  isSpecialDay,
  updateSpecialDay,
  deleteSpecialDay,
  getCheckInReward
}
