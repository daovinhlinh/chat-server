import { Response } from 'express'
import { startSession } from 'mongoose'
import { StatusCodes, ReasonPhrases } from 'http-status-codes'
import winston from 'winston'

import { CustomReasonPhrases, ExpiresInDays } from '~/constants'
import {
  SignInPayload,
  SignOutPayload,
  SignUpPayload,
  VerifyOtpPayload
} from '~/contracts/auth'
import {
  IBodyRequest,
  ICombinedRequest,
  IContextRequest,
  IUserRequest
} from '~/contracts/request'
import { userService } from '~/services'
import { jwtSign, jwtVerify } from '~/utils/jwt'
import { createHash } from '~/utils/hash'
import { createCryptoString } from '~/utils/cryptoString'
import { createDateAddDaysFromNow } from '~/utils/dates'

import otpGenerator from 'otp-generator'
import { redis } from '~/config/redis'
import { mailOptions, mailService } from '~/config/mail'

const signIn = async (
  { body: { username, password } }: IBodyRequest<SignInPayload>,
  res: Response
) => {
  try {
    const userDoc = await userService.getByUsername(username)

    const comparePassword = userDoc?.comparePassword(password)
    if (!userDoc || !comparePassword) {
      return res.status(StatusCodes.NOT_FOUND).json({
        message: CustomReasonPhrases.WRONG_USERNAME_PASSWORD,
        status: StatusCodes.NOT_FOUND
      })
    }

    if (!userDoc.verified) {
      const otp = otpGenerator.generate(6, {
        lowerCaseAlphabets: false,
        upperCaseAlphabets: false,
        specialChars: false
      })

      // redis.client
      //   .set(`OTP_${username}`, otp, { EX: 60 }) //expired in 1 minute
      //   .then(async value => {
      //     console.log(console.log('OTP stored in Redis for user', value))
      //     try {
      //       mailService.sendMail(
      //         mailOptions(`This is OTP for ${user.username}: ${otp}`),
      //         (error, info) => {
      //           if (error) {
      //             console.error('Error sending email: ', error)
      //           } else {
      //             console.log('Email sent: ', info.response)
      //           }
      //         }
      //       )

      //       return res.status(StatusCodes.BAD_REQUEST).json({
      //         message: CustomReasonPhrases.ACCOUNT_NOT_VERIFIED,
      //         status: StatusCodes.BAD_REQUEST
      //       })
      //     } catch (error) {
      //       console.error('Error sending email: ', error)

      //       // Return error response if email sending fails
      //       return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      //         message: ReasonPhrases.INTERNAL_SERVER_ERROR,
      //         status: StatusCodes.INTERNAL_SERVER_ERROR
      //       })
      //     }
      //   })
      //   .catch(async err => {
      //     winston.error(err)
      //     console.error('Error storing OTP in Redis: ', err)
      //     return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      //       message: ReasonPhrases.INTERNAL_SERVER_ERROR,
      //       status: StatusCodes.INTERNAL_SERVER_ERROR
      //     })
      //   })
    }

    const { token: accessToken } = jwtSign(
      userDoc.id,
      process.env.JWT_SECRET_KEY,
      process.env.JWT_ACCESS_TOKEN_EXPIRATION
    )
    const { token: refreshToken } = jwtSign(
      userDoc.id,
      process.env.JWT_REFRESH_SECRET_KEY,
      process.env.JWT_REFRESH_TOKEN_EXPIRATION
    )
    const user = userDoc.toJSON()

    return res.status(StatusCodes.OK).json({
      data: {
        user,
        accessToken,
        refreshToken
      },
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

const signUp = async (
  {
    body: { username, password, firstName, lastName, role = 'user' }
  }: IBodyRequest<SignUpPayload>,
  res: Response
) => {
  const session = await startSession()
  try {
    const isUserExist = await userService.isExistByUsername(username)

    if (isUserExist) {
      return res.status(StatusCodes.CONFLICT).json({
        message: ReasonPhrases.CONFLICT,
        status: StatusCodes.CONFLICT
      })
    }

    session.startTransaction()
    const hashedPassword = await createHash(password)

    const user = await userService.create(
      {
        username,
        password: hashedPassword,
        firstName,
        lastName,
        role
      },
      session
    )
    if (!user) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        message: ReasonPhrases.BAD_REQUEST,
        status: StatusCodes.BAD_REQUEST
      })
    }

    await userService.createTaiXiuUser(user.id.toString())
    // Send otp to phone
    // const otp = otpGenerator.generate(6, {
    //   lowerCaseAlphabets: false,
    //   upperCaseAlphabets: false,
    //   specialChars: false
    // })

    // redis.client
    //   .set(`OTP_${user.username}`, otp, { EX: 60 }) //expired in 1 minute
    //   .then(value => {
    //     console.log(console.log('OTP stored in Redis for user', value))

    //     mailService.sendMail(
    //       mailOptions(`This is OTP for ${user.username}: ${otp}`),
    //       (error, info) => {
    //         if (error) {
    //           console.error('Error sending email: ', error)
    //         } else {
    //           console.log('Email sent: ', info.response)
    //         }
    //       }
    //     )
    //   })
    //   .catch(async err => {
    //     winston.error(err)
    //     await session.abortTransaction()
    //     session.endSession()
    //     console.error('Error storing OTP in Redis: ', err)
    //     return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
    //       message: ReasonPhrases.INTERNAL_SERVER_ERROR,
    //       status: StatusCodes.INTERNAL_SERVER_ERROR
    //     })
    //   })

    await session.commitTransaction()
    session.endSession()

    return res.status(StatusCodes.OK).json({
      data: user.toJSON(),
      message: ReasonPhrases.OK,
      status: StatusCodes.OK
    })
  } catch (error) {
    winston.error(error)
    console.log(error)

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

const verifyOtp = (
  { body: { otp, username } }: IBodyRequest<VerifyOtpPayload>,
  res: Response
) => {
  redis.client
    .get(`OTP_${username}`)
    .then(async storedOtp => {
      if (storedOtp === otp) {
        const user = await userService.getByUsername(username)

        if (!user) {
          return res.status(StatusCodes.BAD_REQUEST).json({
            message: CustomReasonPhrases.USER_NOT_FOUND,
            status: StatusCodes.BAD_REQUEST
          })
        }

        user.verified = true
        user.save()

        return res.status(StatusCodes.OK).json({
          message: ReasonPhrases.OK,
          status: StatusCodes.OK
        })
      } else {
        return res.status(StatusCodes.BAD_REQUEST).json({
          message: CustomReasonPhrases.WRONG_OTP,
          status: StatusCodes.BAD_REQUEST
        })
      }
    })
    .catch(err => {
      winston.error(err)
      console.error('Get storing OTP in Redis: ', err)

      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        message: ReasonPhrases.INTERNAL_SERVER_ERROR,
        status: StatusCodes.INTERNAL_SERVER_ERROR
      })
    })
}

const signOut = async (
  {
    context: { user, accessToken },
    body: { refreshToken }
  }: ICombinedRequest<IUserRequest, SignOutPayload>,
  res: Response
) => {
  // extract the tokens from the req (depends on the implementation on frontend)
  try {
    const accessTokenPayload = jwtVerify(
      accessToken,
      process.env.JWT_SECRET_KEY
    )
    const refreshTokenPayload = jwtVerify(
      refreshToken,
      process.env.JWT_REFRESH_SECRET_KEY
    )

    // Get the current time as a Unix timestamp (seconds since the epoch)
    const currentTime = Math.floor(Date.now() / 1000)

    // in seconds
    const accessTokenLife = accessTokenPayload.exp - currentTime
    const refreshTokenLife = refreshTokenPayload.exp - currentTime

    Promise.all([
      redis.client.set(`expiredToken:${accessToken}`, `${user.id}`, {
        EX: accessTokenLife, // time to delete key
        NX: true
      }),
      redis.client.set(`expiredToken:${refreshToken}`, `${user.id}`, {
        EX: refreshTokenLife, // time to delete key
        NX: true
      })
    ])

    return res.status(StatusCodes.OK).json({
      message: ReasonPhrases.OK,
      status: StatusCodes.OK
    })
  } catch (error) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      message: ReasonPhrases.BAD_REQUEST,
      status: StatusCodes.BAD_REQUEST
    })
  }
}

const refresh = async (
  { body: { refreshToken } }: IBodyRequest<SignOutPayload>,
  res: Response
) => {
  try {
    const payload = jwtVerify(refreshToken, process.env.JWT_REFRESH_SECRET_KEY)

    if (!payload) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        message: ReasonPhrases.BAD_REQUEST,
        status: StatusCodes.BAD_REQUEST
      })
    }

    const isExpired = await redis.client.get(`expiredToken:${refreshToken}`)

    if (isExpired) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        message: ReasonPhrases.UNAUTHORIZED,
        status: StatusCodes.UNAUTHORIZED
      })
    }

    const { token: accessToken } = jwtSign(
      payload.id,
      process.env.JWT_SECRET_KEY,
      process.env.JWT_ACCESS_TOKEN_EXPIRATION
    )

    // Get the current time as a Unix timestamp (seconds since the epoch)
    const currentTime = Math.floor(Date.now() / 1000)
    const refreshTokenExpiration = payload.exp

    let newRefreshToken = refreshToken
    // refresh token life left less than access token life
    if (refreshTokenExpiration - currentTime < 900) {
      newRefreshToken = jwtSign(
        payload.id,
        process.env.JWT_REFRESH_SECRET_KEY,
        process.env.JWT_REFRESH_TOKEN_EXPIRATION
      ).token
    }

    return res.status(StatusCodes.OK).json({
      data: {
        accessToken,
        refreshToken: newRefreshToken
      },
      message: ReasonPhrases.OK,
      status: StatusCodes.OK
    })
  } catch (error) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      message: ReasonPhrases.BAD_REQUEST,
      status: StatusCodes.BAD_REQUEST
    })
  }
}

export const authController = {
  signIn,
  signUp,
  verifyOtp,
  signOut,
  refresh
  // signOut: async (
  //   { context: { user, accessToken } }: IContextRequest<IUserRequest>,
  //   res: Response
  // ) => {
  //   try {
  //     await redis.client.set(`expiredToken:${accessToken}`, `${user.id}`, {
  //       EX: process.env.REDIS_TOKEN_EXPIRATION,
  //       NX: true
  //     })

  //     return res.status(StatusCodes.OK).json({
  //       message: ReasonPhrases.OK,
  //       status: StatusCodes.OK
  //     })
  //   } catch (error) {
  //     return res.status(StatusCodes.BAD_REQUEST).json({
  //       message: ReasonPhrases.BAD_REQUEST,
  //       status: StatusCodes.BAD_REQUEST
  //     })
  //   }
  // }

  // resetPassword: async (
  //   { body: { email } }: IBodyRequest<ResetPasswordPayload>,
  //   res: Response
  // ) => {
  //   const session = await startSession()

  //   try {
  //     const user = await userService.getByEmail(email)

  //     if (!user) {
  //       return res.status(StatusCodes.OK).json({
  //         message: ReasonPhrases.OK,
  //         status: StatusCodes.OK
  //       })
  //     }

  //     session.startTransaction()

  //     const cryptoString = createCryptoString()

  //     const dateFromNow = createDateAddDaysFromNow(ExpiresInDays.ResetPassword)

  //     const resetPassword = await resetPasswordService.create(
  //       {
  //         userId: user.id,
  //         accessToken: cryptoString,
  //         expiresIn: dateFromNow
  //       },
  //       session
  //     )

  //     await userService.addResetPasswordToUser(
  //       {
  //         userId: user.id,
  //         resetPasswordId: resetPassword.id
  //       },
  //       session
  //     )

  //     const userMail = new UserMail()

  //     userMail.resetPassword({
  //       email: user.email,
  //       accessToken: cryptoString
  //     })

  //     await session.commitTransaction()
  //     session.endSession()

  //     return res.status(StatusCodes.OK).json({
  //       message: ReasonPhrases.OK,
  //       status: StatusCodes.OK
  //     })
  //   } catch (error) {
  //     winston.error(error)

  //     if (session.inTransaction()) {
  //       await session.abortTransaction()
  //       session.endSession()
  //     }
  //     return res.status(StatusCodes.BAD_REQUEST).json({
  //       message: ReasonPhrases.BAD_REQUEST,
  //       status: StatusCodes.BAD_REQUEST
  //     })
  //   }
  // },

  // newPassword: async (
  //   {
  //     body: { password },
  //     params
  //   }: ICombinedRequest<null, NewPasswordPayload, { accessToken: string }>,
  //   res: Response
  // ) => {
  //   const session = await startSession()
  //   try {
  //     const resetPassword = await resetPasswordService.getByValidAccessToken(
  //       params.accessToken
  //     )

  //     if (!resetPassword) {
  //       return res.status(StatusCodes.FORBIDDEN).json({
  //         message: ReasonPhrases.FORBIDDEN,
  //         status: StatusCodes.FORBIDDEN
  //       })
  //     }

  //     const user = await userService.getById(resetPassword.user)

  //     if (!user) {
  //       return res.status(StatusCodes.NOT_FOUND).json({
  //         message: ReasonPhrases.NOT_FOUND,
  //         status: StatusCodes.NOT_FOUND
  //       })
  //     }

  //     session.startTransaction()
  //     const hashedPassword = await createHash(password)

  //     await userService.updatePasswordByUserId(
  //       resetPassword.user,
  //       hashedPassword,
  //       session
  //     )

  //     await resetPasswordService.deleteManyByUserId(user.id, session)

  //     const { accessToken } = jwtSign(user.id)

  //     const userMail = new UserMail()

  //     userMail.successfullyUpdatedPassword({
  //       email: user.email
  //     })

  //     await session.commitTransaction()
  //     session.endSession()

  //     return res.status(StatusCodes.OK).json({
  //       data: { accessToken },
  //       message: ReasonPhrases.OK,
  //       status: StatusCodes.OK
  //     })
  //   } catch (error) {
  //     winston.error(error)

  //     if (session.inTransaction()) {
  //       await session.abortTransaction()
  //       session.endSession()
  //     }

  //     return res.status(StatusCodes.BAD_REQUEST).json({
  //       message: ReasonPhrases.BAD_REQUEST,
  //       status: StatusCodes.BAD_REQUEST
  //     })
  //   }
  // }
}
