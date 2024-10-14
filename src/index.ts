import bodyParser from 'body-parser'
import express from 'express'
import http from 'http'
import path from 'path'
import socketio from 'socket.io'
import { mongooseDb } from './config/db'
import { redis } from './config/redis'
import './infrastructure/logger'
import {
  authMiddleware,
  corsMiddleware,
  notFoundMiddleware
} from './middlewares'
import { router } from './routes'
import { initializeSockets } from './sockets/index'

import { createClient } from 'redis'
mongooseDb.run()

redis.client.on('connect', () => console.log('Connected to Redis'))

redis.run()

// const client = createClient({
//   password: 'uVuQSBSuaVlaPN5rVNCRG1NY4exHGuKd',
//   socket: {
//     host: 'redis-18676.c292.ap-southeast-1-1.ec2.redns.redis-cloud.com',
//     port: 18676
//   }
// })
// client.on('connect', () => console.log('Connected to Redis'))
// client.connect()

const app = express()

const server = http.createServer(app)
const io = new socketio.Server(server, {
  cors: {
    origin: '*'
  }
})
initializeSockets(io)

// Middleware
app.use(
  express.json(),
  express.urlencoded({ extended: true }),
  corsMiddleware,
  authMiddleware
)

app.use(express.static(path.join(__dirname, 'public')))

app.use('/api/v1/', router, notFoundMiddleware)
// app.use()

//CREATE EXPRESS APP
// app.use(bodyParser.json())
// app.use(bodyParser.urlencoded())
// app.use(bodyParser.urlencoded({ extended: true }))

// Setup CORS policy
// app.use((req, res, next) => {
//   res.setHeader('Access-Control-Allow-Origin', '*')
//   res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE')
//   res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
//   next()
// })
// app.use(cors())

// process.on('uncaughtException', (error) => {
//   console.error('Uncaught exception:', error)
//   // Optionally, you can perform cleanup tasks or other actions here
// })

const PORT = process.env.APP_PORT || 3000

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`)
})
