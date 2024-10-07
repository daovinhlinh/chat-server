import { Router } from 'express'
import { chatController } from '~/controllers/chatController'
import { authGuard } from '~/guards/authGuard'

//Get all contact of user
export const chat = (router: Router): void => {
  router.get('/chat/getAll', authGuard.isAuth, chatController.getAllChat)
}
