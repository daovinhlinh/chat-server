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
