import bodyParser from 'body-parser'
import express from 'express'
import http from 'http'
import path from 'path'
import socketio from 'socket.io'
import { mongooseDb } from './config/db'
import './infrastructure/logger'
import {
  authMiddleware,
  corsMiddleware,
  notFoundMiddleware
} from './middlewares'
import { router } from './routes'
import { initializeSockets } from './sockets/index'

mongooseDb.run()

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
