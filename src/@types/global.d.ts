import { IJwtUser } from '~/contracts/jwt'

export declare global {
  namespace Express {
    interface Request {
      context: Context
    }
    interface Socket {
      user: IJwtUser
    }
  }

  namespace NodeJS {
    interface ProcessEnv {
      DB_USER: string
      DB_PASSWORD: string
      DB_HOST: string
      DB_NAME: string
      JWT_SECRET_KEY: string
      JWT_REFRESH_SECRET_KEY: string
      APP_PORT: number
      REDIS_HOST: string
      REDIS_PORT: number
      REDIS_PASSWORD: string
      JWT_ACCESS_TOKEN_EXPIRATION: string
      JWT_REFRESH_TOKEN_EXPIRATION: string
      TWILIO_ACCOUNT_SID: string
      TWILIO_AUTH_TOKEN: string
      TWILIO_SERVICE_SID: string
      OTP_EXPIRED_TIME: number
      // JWT_SECRET: string
      // JWT_EXPIRATION: string
      // MAIL_HOST: string
      // MAIL_PORT: number
      // MAIL_USER: string
      // MAIL_PASSWORD: string
      // MAIL_TPL_PATH: string
      // STORAGE_PATH: string
    }
  }
}
