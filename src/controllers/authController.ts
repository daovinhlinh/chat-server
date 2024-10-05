import { Response } from 'express'
import { startSession } from 'mongoose'
import { StatusCodes, ReasonPhrases } from 'http-status-codes'
import winston from 'winston'

import { ExpiresInDays } from '~/constants'
import { SignInPayload, SignUpPayload } from '~/contracts/auth'
import { IBodyRequest } from '~/contracts/request'
import { userService } from '~/services'
import { jwtSign } from '~/utils/jwt'
import { createHash } from '~/utils/hash'
import { createCryptoString } from '~/utils/cryptoString'
import { createDateAddDaysFromNow } from '~/utils/dates'

const signIn = async (
  { body: { username, password } }: IBodyRequest<SignInPayload>,
  res: Response
) => {
  try {
    const userDoc = await userService.getByUsername(username)

    const comparePassword = userDoc?.comparePassword(password)
    if (!userDoc || !comparePassword) {
      return res.status(StatusCodes.NOT_FOUND).json({
        message: ReasonPhrases.NOT_FOUND,
        status: StatusCodes.NOT_FOUND
      })
    }

    const { accessToken } = jwtSign(userDoc.id)
    const user = userDoc.toJSON()

    return res.status(StatusCodes.OK).json({
      data: {
        user,
        accessToken
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
    console.log('user', user)
    if (!user) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        message: ReasonPhrases.BAD_REQUEST,
        status: StatusCodes.BAD_REQUEST
      })
    }
    // const cryptoString = createCryptoString()

    // const dateFromNow = createDateAddDaysFromNow(ExpiresInDays.Verification)

    // const verification = await verificationService.create(
    //   {
    //     userId: user.id,
    //     email,
    //     accessToken: cryptoString,
    //     expiresIn: dateFromNow
    //   },
    //   session
    // )

    // await userService.addVerificationToUser(
    //   {
    //     userId: user.id,
    //     verificationId: verification.id
    //   },
    //   session
    // )

    // const { accessToken } = jwtSign(user.id)

    // const userMail = new UserMail()

    // userMail.signUp({
    //   email: user.email
    // })

    // userMail.verification({
    //   email: user.email,
    //   accessToken: cryptoString
    // })
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

export const authController = {
  signIn,
  signUp
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
