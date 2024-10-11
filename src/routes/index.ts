import { Router } from 'express'

import { chat } from './chat'
import { message } from './message'
import { auth } from './auth'
import { user } from './user'
import { game } from './game'
import { checkin } from './checkin'

const router: Router = Router()
const routes: {
  [key: string]: (router: Router) => void
} = { chat, message, auth, user, game, checkin }

router.get('/', (req, res) => {
  res.redirect('/api/v1/health')
})
router.get('/health', (req, res) => {
  return res.status(200).json({ status: 'OK' })
})

for (const route in routes) {
  routes[route](router)
}

export { router }
