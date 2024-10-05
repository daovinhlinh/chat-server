import { Router } from 'express'
import { chatController } from '~/controllers/chatController'
import { authGuard } from '~/guards/authGuard'

export const chat = (router: Router): void => {
  router.get('/chat/getAll', authGuard.isAuth, chatController.getAllChat)
  // router.get('/chat/getAll', () => {})
}
