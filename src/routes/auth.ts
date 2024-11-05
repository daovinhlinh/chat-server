import { Router } from 'express'
import { mailOptions, mailService } from '~/config/mail'
import { authController } from '~/controllers'
import { authGuard } from '~/guards'
import { authValidation } from '~/validations/authValidation'
import otpGenerator from 'otp-generator'
import {
  rateLimitMiddleware,
  resendOtpRateLimitMiddleware
} from '~/middlewares/rateLimitMiddleware'

export const auth = (router: Router): void => {
  router.post(
    '/auth/sign-in',
    authGuard.isGuest,
    authValidation.signIn,
    authController.signIn
  )

  router.post(
    '/auth/sign-up',
    authGuard.isGuest,
    authValidation.signUp,
    authController.signUp
  )

  router.post(
    '/auth/activate',
    authGuard.isGuest,
    authValidation.activate,
    authController.activate
  )

  router.post(
    '/auth/verifyOtp',
    authGuard.isGuest,
    rateLimitMiddleware,
    authValidation.verifyOtp,
    authController.verifyOtp
  )

  router.post(
    '/auth/resendOtp',
    authGuard.isGuest,
    resendOtpRateLimitMiddleware,
    authValidation.resendOtp,
    authController.resendOtp
  )

  // router.post('/auth/testMail', authGuard.isGuest, () => {
  //   const otp = otpGenerator.generate(6, {
  //     lowerCaseAlphabets: false,
  //     upperCaseAlphabets: false,
  //     specialChars: false
  //   })

  //   mailService.sendMail(
  //     mailOptions(`This is OTP for: ${otp}`),
  //     (error, info) => {
  //       if (error) {
  //         console.error('Error sending email: ', error)
  //       } else {
  //         console.log('Email sent: ', info.response)
  //       }
  //     }
  //   )
  // })

  router.post(
    '/auth/verifyOtp',
    authGuard.isGuest,
    rateLimitMiddleware,
    authController.verifyOtp
  )

  router.post(
    '/auth/sign-out',
    authGuard.isAuth,
    authValidation.signOut,
    authController.signOut
  )

  router.post(
    '/auth/refreshToken',
    authValidation.refresh,
    authController.refresh
  )

  // router.post(
  //   '/auth/password/reset',
  //   authGuard.isGuest,
  //   authValidation.resetPassword,
  //   authController.resetPassword
  // )

  // router.post(
  //   '/auth/password/new/:accessToken',
  //   authValidation.newPassword,
  //   authController.newPassword
  // )
}
