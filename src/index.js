import express from 'express'
import bodyParser from 'body-parser'
import seneca from './seneca'

const requiredVars = [
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

import firebase from 'firebase'
import {startDispatch} from './dispatch'
import {makeCollections} from './collections'

import tasks from './tasks'

const app = express()
app.use(bodyParser.json())

//app.use(seneca().export('web'))
app.get('/', (req,res) => res.send('Hello World!'))

app.listen(cfg.PORT, () => console.log('Listening on ', cfg.PORT))

const fbConfig = {
  databaseURL: 'https://sparks-jeremy-ccd3d.firebaseio.com',
  serviceAccount: 'sparks-jeremy-14deca79722c.json',
}
firebase.initializeApp(fbConfig)
const ref = firebase.database().ref()
const queueRef = ref.child('!queue')
const usersRef = ref.child('Users')

console.log('Connected firebase to', cfg.FIREBASE_HOST)

const remote = makeCollections(ref, [
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
  set: (uid, profileKey) => usersRef.child(uid).set(profileKey),
}

import braintree from 'braintree-node'

remote.gateway = braintree({
  environment: cfg.BT_ENVIRONMENT,
  merchantId: cfg.BT_MERCHANT_ID,
  publicKey: cfg.BT_PUBLIC_KEY,
  privateKey: cfg.BT_PRIVATE_KEY,
})

startDispatch(queueRef, remote, tasks)
