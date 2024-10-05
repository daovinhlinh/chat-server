// src/routes/messageRoutes.ts

import { Router } from 'express'
import * as messageController from '../controllers/messageController'

export const message = (router: Router) => {
  router.get('/message/getAll', messageController.getPublicMessages)
  router.get('/message/:id', messageController.getMessageById)
}
