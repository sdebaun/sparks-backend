import Firebase from 'firebase'

const requiredVars = [
  'FIREBASE_HOST',
  'FIREBASE_TOKEN',
  'BT_MERCHANT_ID',
  'BT_PUBLIC_KEY',
  'BT_PRIVATE_KEY',
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

const fb = new Firebase(cfg.FIREBASE_HOST)

fb.authWithCustomToken(cfg.FIREBASE_TOKEN, err => {
  if (err) {
    console.log('FB Auth err:',err); process.exit()
  } else {
    console.log('FB Authed successfully')
  }
})

import braintree from 'braintree-node'

const gateway = braintree({
  environment: 'Sandbox',
  merchantId: cfg.BT_MERCHANT_ID,
  publicKey: cfg.BT_PUBLIC_KEY,
  privateKey: cfg.BT_PRIVATE_KEY,
})

const getProfile = key =>
  fb.child('Profiles').child(key).once('value').then(s => s.val())

const objToRows = obj =>
  obj && Object.keys(obj).map(k => ({$key: k, ...obj[k]})) || []

fb.child('Engagements').once('value')
.then(snap => snap.val())
.then(objToRows)
.then(engagements => {
  console.log(engagements.length, 'engagements count')
  return Promise.all(
    engagements
      .filter(e => e.priority || e.isAccepted)
      .map(e =>
        gateway.generateClientToken()
        .then(({clientToken}) =>
          fb.child('Engagements').child(e.$key).update({
            paymentClientToken: clientToken,
          })
        )
      )
  )
})
.then(() => process.exit())
.catch(err => console.log('err',err))
