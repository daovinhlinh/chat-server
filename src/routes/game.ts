import { Router } from 'express'
import { gameController } from '~/controllers'
import { authGuard } from '~/guards'
import { gameValidation } from '~/validations/gameValidation'

export const game = (router: Router): void => {
  router.post('/game/roll', authGuard.isAuth, gameController.rollDice)

  router.post('/game/checkin', authGuard.isAuth, gameController.checkIn)

  router.get(
    '/game/checkin/history',
    authGuard.isAuth,
    gameValidation.getCheckInHistory,
    gameController.getCheckInHistory
  )

  router.get('/game/ranking', gameController.getRanking)

  router.post('/game/updateCoin', authGuard.isAdmin, gameController.updateCoin)
}
