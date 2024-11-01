// generate instance of twilio
import twilio from 'twilio'

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
)

// send sms
const sendSms = async (phone: string, message: string) => {
  await client.messages.create({
    body: message,
    to: phone
  })
}

export const smsService = {
  sendSms
}
