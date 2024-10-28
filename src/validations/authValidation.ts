import { NextFunction, Response } from 'express'
import validator from 'validator'
import { StatusCodes, ReasonPhrases } from 'http-status-codes'
import winston from 'winston'

import { SignInPayload, SignOutPayload, SignUpPayload } from '~/contracts/auth'
import { IBodyRequest } from '~/contracts/request'
import { CustomReasonPhrases } from '~/constants'

export const authValidation = {
  signIn: (
    req: IBodyRequest<SignInPayload>,
    res: Response,
    next: NextFunction
  ) => {
    try {
      // Check if username and password are provided
      if (!req.body.username || !req.body.password) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          message: ReasonPhrases.BAD_REQUEST,
          status: StatusCodes.BAD_REQUEST
        })
      }

      const { username, password } = req.body

      // let normalizedEmail =
      //   req.body.email && validator.normalizeEmail(req.body.email)
      // if (normalizedEmail) {
      //   normalizedEmail = validator.trim(normalizedEmail)
      // }

      const isUsernameValid =
        validator.isAlphanumeric(username) &&
        validator.isLength(username, { min: 3, max: 30 })
      if (!isUsernameValid) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          message: ReasonPhrases.BAD_REQUEST,
          status: StatusCodes.BAD_REQUEST
        })
      }

      // if (
      //   !normalizedEmail ||
      //   !validator.isEmail(normalizedEmail, { allow_utf8_local_part: false })
      // ) {
      //   return res.status(StatusCodes.BAD_REQUEST).json({
      //     message: ReasonPhrases.BAD_REQUEST,
      //     status: StatusCodes.BAD_REQUEST
      //   })
      // }

      return next()
    } catch (error) {
      winston.error(error)

      return res.status(StatusCodes.BAD_REQUEST).json({
        message: ReasonPhrases.BAD_REQUEST,
        status: StatusCodes.BAD_REQUEST
      })
    }
  },

  signUp: (
    req: IBodyRequest<SignUpPayload>,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { username, password } = req.body

      if (
        !username ||
        !password ||
        !validator.isLength(password, { min: 6, max: 48 })
      ) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          message: ReasonPhrases.BAD_REQUEST,
          status: StatusCodes.BAD_REQUEST
        })
      }

      const isUsernameValid =
        validator.isAlphanumeric(username) &&
        validator.isLength(username, { min: 3, max: 30 })

      if (!isUsernameValid) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          message: ReasonPhrases.BAD_REQUEST,
          status: StatusCodes.BAD_REQUEST
        })
      }

      // if (
      //   !normalizedEmail ||
      //   !validator.isEmail(normalizedEmail, { allow_utf8_local_part: false })
      // ) {
      //   return res.status(StatusCodes.BAD_REQUEST).json({
      //     message: ReasonPhrases.BAD_REQUEST,
      //     status: StatusCodes.BAD_REQUEST
      //   })
      // }

      // Object.assign(req.body, { email: normalizedEmail })

      return next()
    } catch (error) {
      winston.error(error)

      return res.status(StatusCodes.BAD_REQUEST).json({
        message: ReasonPhrases.BAD_REQUEST,
        status: StatusCodes.BAD_REQUEST
      })
    }
  },

  signOut: (
    req: IBodyRequest<SignOutPayload>,
    res: Response,
    next: NextFunction
  ) => {
    try {
      // Check if username and password are provided
      if (!req.body.refreshToken) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          message: CustomReasonPhrases.REFRESH_TOKEN_MISSING,
          status: StatusCodes.BAD_REQUEST
        })
      }

      next()
    } catch (error) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        message: error,
        status: StatusCodes.BAD_REQUEST
      })
    }
  },

  refresh: (
    req: IBodyRequest<SignOutPayload>,
    res: Response,
    next: NextFunction
  ) => {
    try {
      // Check if username and password are provided
      if (!req.body.refreshToken) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          message: CustomReasonPhrases.REFRESH_TOKEN_MISSING,
          status: StatusCodes.BAD_REQUEST
        })
      }

      next()
    } catch (error) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        message: error,
        status: StatusCodes.BAD_REQUEST
      })
    }
  }

  // resetPassword: (
  //   req: IBodyRequest<ResetPasswordPayload>,
  //   res: Response,
  //   next: NextFunction
  // ) => {
  //   try {
  //     if (!req.body.email) {
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

  // newPassword: (
  //   req: IBodyRequest<NewPasswordPayload>,
  //   res: Response,
  //   next: NextFunction
  // ) => {
  //   try {
  //     if (
  //       !req.body.password ||
  //       !validator.isLength(req.body.password, { min: 6, max: 48 })
  //     ) {
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
  // }
}
