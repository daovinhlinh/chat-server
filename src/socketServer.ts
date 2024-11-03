import { Server } from 'socket.io'
import http from 'http'
import { ExtendedServer } from './crons/taixiu'

let io: ExtendedServer

export function initializeSocketServer(server: http.Server) {
  io = new Server(server, {
    cors: {
      origin: '*'
    }
  }) as ExtendedServer

  // Initialize custom properties
  io.TaiXiu_time = 0
  io.TaiXiu_phien = 1
  io.taixiu = {
    taixiu: {
      coin_tai: 0,
      coin_xiu: 0,
      player_tai: 0,
      player_xiu: 0,
      phien: 0
    }
  }
  io.listBot = []
  return io
}

export function getSocketServer() {
  if (!io) {
    throw new Error('Socket server not initialized')
  }
  return io
}
