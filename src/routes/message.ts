// src/routes/messageRoutes.ts

import { Router } from 'express'
import * as messageController from '../controllers/messageController'

export const message = (router: Router) => {
  // Get all public messages
  router.get('/message/getAll', messageController.getPublicMessages)

  // Get message for a specific chat
  router.get('/message/:id', messageController.getMessageById)
}
