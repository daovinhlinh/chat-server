import express from 'express'
import http from 'http'
import socketio from 'socket.io'
import bodyParser from 'body-parser'
import cors from 'cors'
import connectDB from './config/db'
import path from 'path'
import { initializeSockets } from './sockets/index'
import messageRoutes from './routes/messageRoute'
import chatRoutes from './routes/chatRoute'
import authentication from './middlewares/authentication'

const app = express()
const server = http.createServer(app)
const io = new socketio.Server(server, {
  cors: {
    // origin: 'http://localhost:8080'
    origin: '*'
  }
})

// Middleware
app.use(express.json())

//CREATE EXPRESS APP
app.use(bodyParser.json())
app.use(bodyParser.urlencoded())
app.use(bodyParser.urlencoded({ extended: true }))

// Setup CORS policy
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  next()
})
app.use(cors())

app.use(function (err: any, req: any, res: any, next: any) {
  // Maybe log the error for later reference?
  // If this is development, maybe show the stack here in this response?
  res.status(err.status || 500)
  res.send({
    message: err.message
  })
})
;(async () => {
  await connectDB()

  // Serve the chat client
  app.use(express.static(path.join(__dirname, 'public')))

  // Routes
  app.use('/api/message', authentication.authenticateToken, messageRoutes)
  app.use('/api/chat', authentication.authenticateToken, chatRoutes)
  // app.use('/api/auth', userRoutes)
  // app.use('/api/admin', adminRoutes)

  initializeSockets(io)

  // Redirect to login page for root URL
  app.get('/', (req, res) => {
    res.redirect('/health')
  })

  // // Route to serve the login page
  // app.get('/chat', (req, res) => {
  //   res.sendFile(path.join(__dirname, 'public', 'chat.html'))
  // })

  app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK' })
  })

  process.on('uncaughtException', (error) => {
    console.error('Uncaught exception:', error)
    // Optionally, you can perform cleanup tasks or other actions here
  })

  const PORT = process.env.PORT || 3000

  server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`)
  })
})()
