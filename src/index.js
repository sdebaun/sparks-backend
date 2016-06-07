import express from 'express'

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

import Firebase from 'firebase'
import {startDispatch} from './dispatch'
import {makeCollections} from './collections'

import tasks from './tasks'

const app = express()

app.get('/', (req,res) => res.send('Hello World!'))

app.listen(cfg.PORT, () => console.log('Listening on ',cfg.PORT))

const fb = new Firebase(cfg.FIREBASE_HOST)
console.log('Connected firebase to', cfg.FIREBASE_HOST)

const remote = makeCollections(fb, [
  'Arrivals',
  'Assignments',
  'Commitments',
  'Engagements',
  'Fulfillers',
  'Memberships',
  'Opps',
  'Organizers',
  'Projects',
  'ProjectImages',
  'Profiles',
  'Shifts',
  'Teams',
  'TeamImages',
])

remote.Users = {
  set: (uid, profileKey) => fb.child('Users').child(uid).set(profileKey),
}

import braintree from 'braintree-node'

remote.gateway = braintree({
  environment: cfg.BT_ENVIRONMENT,
  merchantId: cfg.BT_MERCHANT_ID,
  publicKey: cfg.BT_PUBLIC_KEY,
  privateKey: cfg.BT_PRIVATE_KEY,
})

console.log('Authenticating...')

fb.authWithCustomToken(cfg.FIREBASE_TOKEN.trim(), err => {
  if (err) {
    console.log('FB Auth err:',err); process.exit()
  } else {
    console.log('FB Authed successfully')
  }
})

startDispatch(fb.child('!queue'), remote, tasks)
