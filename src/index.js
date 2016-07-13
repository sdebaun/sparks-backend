import express from 'express'
import senecaSn from './seneca-sn'
import braintree from 'braintree-node'
import Seneca from 'seneca-await'
import {startDispatch} from './dispatch'
import cfg from './cfg'

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
