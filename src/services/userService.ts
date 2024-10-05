import { ClientSession, ObjectId } from 'mongoose'
import { User } from '~/models/User'

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
const isExistByUsername = (username: string) => User.exists({ username })

export const userService = {
  create,
  getById,
  getByUsername,
  isExistByUsername
}
