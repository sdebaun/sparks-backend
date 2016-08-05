const requiredVars = [
  'FIREBASE_HOST',
  'FIREBASE_TOKEN',
  'BT_ENVIRONMENT',
  'BT_MERCHANT_ID',
  'BT_PUBLIC_KEY',
  'BT_PRIVATE_KEY',
  'SENDGRID_KEY',
  'DOMAIN',
  'PORT',
]

const cfg:any = {}

requiredVars.forEach(v => {
  if (process.env[v]) {
    cfg[v] = process.env[v].trim()
  } else {
    console.log('Must specify ' + v)
    process.exit()
  }
})

export default cfg
