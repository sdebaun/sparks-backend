import Twilio from 'twilio'
import csv from 'fast-csv'

const twilio = Twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)

async function call(row) {
  const [profileKey, name, email, phone, engKey, status, opp] = row
  console.log('calling', name, phone)
  const response = await twilio.messages.create({
    body: 'Youve been accepted as a Northern Nights volunteer! Please go to http://sparks.network to confirm or email help@sparks.network to cancel.',
    to: phone,
    from: process.env.TWILIO_PHONE_NUMBER,
  })
  console.log('response', response)
}

const filename = process.argv[2]
console.log('opening', filename)
csv
.fromPath(filename)
.on('data', call)
.on('end', () => console.log('done'))
