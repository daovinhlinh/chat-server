import { NextFunction, Response } from 'express'
import { ReasonPhrases, StatusCodes } from 'http-status-codes'
import { isValidObjectId } from 'mongoose'
import validator from 'validator'
import winston from 'winston'
import { CustomReasonPhrases } from '~/constants'
import { IBodyRequest } from '~/contracts/request'
import {
  DeleteProfilePayload,
  UpdatePasswordPayload,
  UpdateProfilePayload
} from '~/contracts/user'

export const userValidation = {
  updateProfile: (
    req: IBodyRequest<UpdateProfilePayload>,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { email, phoneNumber } = req.body

      if (!email || !phoneNumber) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          message: ReasonPhrases.BAD_REQUEST,
          status: StatusCodes.BAD_REQUEST
        })
      }

      // validate email
      let normalizedEmail = email && validator.normalizeEmail(email)
      if (normalizedEmail) {
        normalizedEmail = validator.trim(normalizedEmail)
      }

      if (
        !normalizedEmail ||
        !validator.isEmail(normalizedEmail, { allow_utf8_local_part: false })
      ) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          message: CustomReasonPhrases.EMAIL_INVALID,
          status: StatusCodes.BAD_REQUEST
        })
      }

      Object.assign(req.body, { email: normalizedEmail })

      // validate phone number
      if (!validator.isMobilePhone(phoneNumber)) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          message: CustomReasonPhrases.PHONE_NUMBER_INVALID,
          status: StatusCodes.BAD_REQUEST
        })
      }

      Object.assign(req.body, { phoneNumber })

      return next()
    } catch (error) {
      winston.error(error)

      return res.status(StatusCodes.BAD_REQUEST).json({
        message: ReasonPhrases.BAD_REQUEST,
        status: StatusCodes.BAD_REQUEST
      })
    }
  },

  // updateEmail: (
  //   req: IBodyRequest<UpdateEmailPayload>,
  //   res: Response,
  //   next: NextFunction
  // ) => {
  //   try {
  //     if (!req.body.email || !req.body.password) {
  //       return res.status(StatusCodes.BAD_REQUEST).json({
  //         message: ReasonPhrases.BAD_REQUEST,
  //         status: StatusCodes.BAD_REQUEST
  //       })
  //     }

  //     let normalizedEmail =
  //       req.body.email && validator.normalizeEmail(req.body.email)
  //     if (normalizedEmail) {
  //       normalizedEmail = validator.trim(normalizedEmail)
  //     }

  //     if (
  //       !normalizedEmail ||
  //       !validator.isEmail(normalizedEmail, { allow_utf8_local_part: false })
  //     ) {
  //       return res.status(StatusCodes.BAD_REQUEST).json({
  //         message: ReasonPhrases.BAD_REQUEST,
  //         status: StatusCodes.BAD_REQUEST
  //       })
  //     }

  //     Object.assign(req.body, { email: normalizedEmail })

  //     return next()
  //   } catch (error) {
  //     winston.error(error)

  //     return res.status(StatusCodes.BAD_REQUEST).json({
  //       message: ReasonPhrases.BAD_REQUEST,
  //       status: StatusCodes.BAD_REQUEST
  //     })
  //   }
  // },

  updatePassword: (
    { body: { oldPassword, newPassword } }: IBodyRequest<UpdatePasswordPayload>,
    res: Response,
    next: NextFunction
  ) => {
    try {
      if (
        !oldPassword ||
        !newPassword ||
        !validator.isLength(newPassword, { min: 6, max: 48 })
      ) {
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
  },

  // updateAvatar: (
  //   { body: { imageId } }: IBodyRequest<{ imageId: ObjectId }>,
  //   res: Response,
  //   next: NextFunction
  // ) => {
  //   try {
  //     if (!imageId) {
  //       return res.status(StatusCodes.BAD_REQUEST).json({
  //         message: ReasonPhrases.BAD_REQUEST,
  //         status: StatusCodes.BAD_REQUEST
  //       })
  //     }

  //     return next()
  //   } catch (error) {
  //     winston.error(error)

  //     return res.status(StatusCodes.BAD_REQUEST).json({
  //       message: ReasonPhrases.BAD_REQUEST,
  //       status: StatusCodes.BAD_REQUEST
  //     })
  //   }
  // },

  deleteProfile: (
    { body: { userId } }: IBodyRequest<DeleteProfilePayload>,
    res: Response,
    next: NextFunction
  ) => {
    try {
      if (!userId || !isValidObjectId(userId)) {
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
}
