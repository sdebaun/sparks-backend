import Sendgrid from 'sendgrid'

const sendgrid = Sendgrid(Process.env.SENDGRID_KEY)
const DOMAIN = process.env.DOMAIN

function sendConfirmationEmail(cb) {
  console.log('ok Ill send your email')
  cb(null)
}


