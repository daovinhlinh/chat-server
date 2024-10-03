// src/routes/messageRoutes.ts

import { Router } from 'express'
import * as messageController from '../controllers/messageController'

const router = Router()

router.get('/:id', messageController.getMessageById)
// router.post('/messages', messageController.createMessage)

export default router
