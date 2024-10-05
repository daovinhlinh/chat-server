import { connect, ConnectOptions } from 'mongoose'
import dotenv from 'dotenv'

dotenv.config()

const username = process.env.DB_USER
const host = process.env.DB_HOST
const password = process.env.DB_PASSWORD
const database = process.env.DB_NAME
const port = process.env.DB_PORT || '3306'
console.log('port', port)

const options: ConnectOptions = {
  user: username,
  pass: password,
  dbName: database
  // dbName: dbName,
  // database: database,
  // port: parseInt(port)
}
console.log(host, options)

// const connectDB = async () => {
//   try {
//     const db = await mongoose.connect(`mongodb+srv://${host}`, options)
//     console.log('Connected to MongoDB at', host)
//     return db
//   } catch (error) {
//     console.error('MongoDB connection error:', error)
//   }
//   // .then((db) => {
//   //   console.log('Connected to MongoDB at', host)
//   //   return db
//   // })
//   // .catch((error) => {
//   //   console.error('MongoDB connection error:', error)
//   // })
// }

export const mongooseDb = {
  run: async () => {
    try {
      const db = await connect(`mongodb+srv://${host}`, options)
      console.log('Connected to MongoDB at', host)
      return db
    } catch (error) {
      console.error('MongoDB connection error:', error)
    }
    // .then((db) => {
    //   console.log('Connected to MongoDB at', host)
    //   return db
    // })
    // .catch((error) => {
    //   console.error('MongoDB connection error:', error)
    // })
  }
}

// const pool = mysql2.createPool({
//   connectionLimit: 10,
//   host: host,
//   user: username,
//   password: password,
//   database: database
// })

// export default connectDB
