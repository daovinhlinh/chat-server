import { ReasonPhrases, StatusCodes } from 'http-status-codes'
import {
  IBodyRequest,
  ICombinedRequest,
  IContextRequest,
  IParamsRequest,
  IQueryRequest,
  IUserRequest
} from '~/contracts/request'
import {
  DeleteProfilePayload,
  GetAllUsersPayload,
  GetUserByIdPayload,
  UpdatePasswordPayload,
  UpdateProfilePayload
} from '~/contracts/user'
import { Response } from 'express'
import { userService } from '~/services'
import winston from 'winston'
import { startSession, Types } from 'mongoose'
import { createHash } from '~/utils/hash'
import { CustomReasonPhrases } from '~/constants'

const me = async (
  { context: { user } }: IContextRequest<IUserRequest>,
  res: Response
) => {
  if (!user) {
    return res.status(StatusCodes.NOT_FOUND).json({
      message: ReasonPhrases.NOT_FOUND,
      status: StatusCodes.NOT_FOUND
    })
  }

  return res.status(StatusCodes.OK).json({
    data: user.toJSON(),
    message: ReasonPhrases.OK,
    status: StatusCodes.OK
  })
}

const updateProfile = async (
  {
    context: { user },
    body: { firstName, lastName, email, phoneNumber }
  }: ICombinedRequest<IUserRequest, UpdateProfilePayload>,
  res: Response
) => {
  try {
    const updatedProfile = await userService.updateProfileByUserId(user.id, {
      firstName,
      lastName,
      email,
      phoneNumber
    })

    return res.status(StatusCodes.OK).json({
      data: updatedProfile,
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

const deleteProfile = async (
  { body: { userId } }: IBodyRequest<DeleteProfilePayload>,
  res: Response
) => {
  const session = await startSession()

  try {
    const user = await userService.getById(userId)

    if (!user) {
      return res.status(StatusCodes.FORBIDDEN).json({
        message: ReasonPhrases.FORBIDDEN,
        status: StatusCodes.FORBIDDEN
      })
    }
    session.startTransaction()

    const result = await userService.deleteById(user.id, session)
    if (!result || !result.deletedCount) {
      await session.abortTransaction()
      session.endSession()

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

const updatePassword = async (
  {
    context: {
      user: { id }
    },
    body: { oldPassword, newPassword }
  }: ICombinedRequest<IUserRequest, UpdatePasswordPayload>,
  res: Response
) => {
  try {
    const user = await userService.getById(id)

    const comparePassword = user?.comparePassword(oldPassword)

    if (!user || !comparePassword) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        message: CustomReasonPhrases.PASSWORD_NOT_MATCH,
        status: StatusCodes.BAD_REQUEST
      })
    }

    const hashedPassword = await createHash(newPassword)

    await userService.updatePasswordByUserId(user.id, hashedPassword)

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

const getAllUsers = async (
  { query: { limit, page = 1 } }: IQueryRequest<GetAllUsersPayload>,
  res: Response
) => {
  try {
    const { users, totalPages } = await userService.getAll(page, limit)

    return res.status(StatusCodes.OK).json({
      data: { users, page, totalPages },
      message: ReasonPhrases.OK,
      status: StatusCodes.OK
    })
  } catch (error) {
    winston.error(error)
    console.log('error', error)

    return res.status(StatusCodes.BAD_REQUEST).json({
      message: ReasonPhrases.BAD_REQUEST,
      status: StatusCodes.BAD_REQUEST
    })
  }
}

const getUserById = async (
  { params: { id } }: IParamsRequest<GetUserByIdPayload>,
  res: Response
) => {
  try {
    const user = await userService.getById(id)

    if (!user) {
      return res.status(StatusCodes.NOT_FOUND).json({
        message: ReasonPhrases.NOT_FOUND,
        status: StatusCodes.NOT_FOUND
      })
    }

    return res.status(StatusCodes.OK).json({
      data: user,
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

export const userController = {
  me,
  updateProfile,
  deleteProfile,
  updatePassword,
  getAllUsers,
  getUserById
}
