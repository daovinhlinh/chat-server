// Import the Nodemailer library
import nodemailer from 'nodemailer'

// Create a transporter using SMTP transport
export const mailService = nodemailer.createTransport({
  host: 'smtp.ethereal.email',
  port: 587,
  auth: {
    user: 'aletha.grimes84@ethereal.email',
    pass: 'syyzzGefNfAqKkrzmC'
  }
})

// Email data
export const mailOptions = (text: string) => ({
  from: 'aletha.grimes84@ethereal.email',
  to: 'linh142000@gmail.com',
  subject: 'Node.js Email Tutorial',
  text
})
