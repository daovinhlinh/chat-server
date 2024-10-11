import { Router } from 'express'
import { gameController } from '~/controllers'
import { authGuard } from '~/guards'

export const game = (router: Router): void => {
  router.post('/game/roll', authGuard.isAuth, gameController.rollDice)

  router.get('/game/ranking', gameController.getRanking)

  router.post('/game/updateCoin', authGuard.isAdmin, gameController.updateCoin)
}
