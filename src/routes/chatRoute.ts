import { Router } from 'express'
import * as chatController from '../controllers/chatController'

const router = Router()

router.get('/getAll', chatController.getAllChat)

export default router
