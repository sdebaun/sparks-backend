import express from 'express'
import senecaSn from './seneca-sn'
import braintree from 'braintree-node'
import Seneca from 'seneca-await'
import {startDispatch} from './dispatch'

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

const cfg = {}

requiredVars.forEach(v => {
  if (process.env[v]) {
    cfg[v] = process.env[v].trim()
  } else {
    console.log('Must specify ' + v)
    process.exit()
  }
})

const app = express()
const remote = {}

app.get('/', (req,res) => res.send('Hello World!'))
app.listen(cfg.PORT, () => console.log('Listening on ',cfg.PORT))

remote.gateway = braintree({
  environment: cfg.BT_ENVIRONMENT,
  merchantId: cfg.BT_MERCHANT_ID,
  publicKey: cfg.BT_PUBLIC_KEY,
  privateKey: cfg.BT_PRIVATE_KEY,
})

const seneca = Seneca({
  debug: {
    undead: true,
  },
})
seneca.use(senecaSn, {cfg, remote})

seneca.ready()
  .then(function() {
    seneca.act({role:'Firebase'})
      .then(function({fb}) {
        console.log('Starting dispatch')
        startDispatch(fb.child('!queue'), seneca)
      })
  })
