import { ClientSession, ObjectId } from 'mongoose'
import { IUser, UpdateProfilePayload } from '~/contracts/user'
import { TaiXiuUser } from '~/models/TaiXiu_user'
import { User } from '~/models/User'
import { paginate } from '~/utils/paging'

const getAll = async (page: number = 1, limit: number = 20) => {
  const skip = (page - 1) * limit

  const totalDocuments = await User.countDocuments({ role: { $ne: 'admin' } })
  const totalPages = Math.ceil(totalDocuments / limit)

  const users = await User.find({ role: { $ne: 'admin' } })
    .skip(skip)
    .limit(limit)

  return {
    totalDocs: totalDocuments,
    totalPages,
    users
  }
}

const getById = (id: ObjectId) => {
  return User.findById(id)
}

const getByUsername = (username: string) => {
  return User.findOne({ username })
}

const create = async (
  {
    username,
    password,
    firstName,
    lastName,
    role = 'user'
  }: {
    username: string
    password: string
    firstName: string
    lastName: string
    verified?: boolean
    role: 'user' | 'admin'
  },
  session?: ClientSession
) => {
  try {
    const user = new User({
      username,
      password,
      firstName,
      lastName,
      role
    })
    const saved = await user.save({ session })
    return saved
  } catch (error) {
    console.log('create error', error)
  }
}

const createTaiXiuUser = (uid: string) => {
  return new TaiXiuUser({ uid }).save()
}

const isExistByUsername = (username: string) => User.exists({ username })

const updateProfileByUserId = (
  userId: ObjectId,
  { firstName, lastName, email, phoneNumber }: UpdateProfilePayload,
  session?: ClientSession
) => {
  const data = [
    { _id: userId },
    { firstName, lastName, email, phoneNumber },
    { new: true }
  ]

  let params = null

  if (session) {
    params = [...data, { session }]
  } else {
    params = data
  }

  return User.findOneAndUpdate(...params)
}

const deleteById = (userId: ObjectId, session?: ClientSession) =>
  User.deleteOne({ _id: userId }, { session })

const updatePasswordByUserId = (
  userId: ObjectId,
  password: string,
  session?: ClientSession
) => {
  const data = [{ _id: userId }, { password, resetPasswords: [] }]

  let params = null

  if (session) {
    params = [...data, { session }]
  } else {
    params = data
  }

  return User.updateOne(...params)
}

const searchByUsername = (
  username: string,
  page: number = 1,
  limit: number = 25
) => {
  return paginate<IUser>(
    User,
    { username: { $regex: username, $options: 'i' } },
    { page, limit }
  )
}

export const userService = {
  getAll,
  create,
  createTaiXiuUser,
  getById,
  getByUsername,
  isExistByUsername,
  updateProfileByUserId,
  updatePasswordByUserId,
  deleteById,
  searchByUsername
}
