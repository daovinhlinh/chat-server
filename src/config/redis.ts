import { createClient, RedisClientType } from 'redis'
import winston from 'winston'

class Redis {
  private static instance: Redis

  public client: RedisClientType

  constructor() {
    this.createClient()
  }

  private createClient() {
    try {
      this.client = createClient({
        password: process.env.REDIS_PASSWORD,
        socket: {
          host: process.env.REDIS_HOST,
          port: process.env.REDIS_PORT
        }
      })
    } catch (error) {
      winston.error(error)
    }
  }

  public async run() {
    try {
      await this.client.connect()
    } catch (error) {
      console.log('Redis erorr', error)

      winston.error(error)
    }
  }

  public async stop() {
    try {
      await this.client.disconnect()
    } catch (error) {
      winston.error(error)
    }
  }

  public static getInstance(): Redis {
    if (!Redis.instance) {
      Redis.instance = new Redis()
    }

    return Redis.instance
  }
}

export const redis = Redis.getInstance()
