// generate instance of twilio
import twilio from 'twilio'

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
)

// send sms
const sendSms = async (phone: string, message: string) => {
  try {
    await client.messages.create({
      body: message,
      to: phone,
      messagingServiceSid: process.env.TWILIO_SERVICE_SID
    })
  } catch (error) {
    console.log('error', error)
  }
}

export const smsService = {
  sendSms
}
