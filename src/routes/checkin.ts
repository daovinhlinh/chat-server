import { Router } from 'express'
import { checkinController } from '~/controllers/checkinController'
import { authGuard } from '~/guards'
import { checkinValidation } from '~/validations/checkinValidation'

export const checkin = (router: Router): void => {
  router.post('/checkin', authGuard.isAuth, checkinController.checkIn)

  //get checkin history
  router.get(
    '/checkin/history',
    authGuard.isAuth,
    checkinValidation.getCheckInHistory,
    checkinController.getCheckInHistory
  )

  router.get(
    '/checkin/getConfig',
    authGuard.isAuth,
    checkinController.getCheckInConfig
  )

  router.post(
    '/checkin/addSpecialDay',
    authGuard.isAdmin,
    checkinValidation.addSpecialDay,
    checkinController.addSpecialDay
  )

  router.post(
    '/checkin/updateDefaultCoin',
    authGuard.isAdmin,
    checkinValidation.updateCheckInCoin,
    checkinController.updateCheckInCoin
  )

  router.post(
    '/checkin/updateSpecialDay',
    authGuard.isAdmin,
    checkinValidation.updateSpecialDay,
    checkinController.updateSpecialDay
  )

  router.post(
    '/checkin/deleteSpecialDay',
    authGuard.isAdmin,
    checkinValidation.deleteSpecialDay,
    checkinController.deleteSpecialDay
  )
}
