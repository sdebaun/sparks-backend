const requiredVars = [
  'FIREBASE_HOST',
  'FIREBASE_TOKEN',
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

const fb = new Firebase(cfg.FIREBASE_HOST)
console.log('Connected firebase to', cfg.FIREBASE_HOST)

const remote = makeCollections(fb, [
  'Commitments',
  'Engagements',
  'Fulfillers',
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

console.log('Authenticating...')

fb.authWithCustomToken(cfg.FIREBASE_TOKEN.trim(), err => {
  if (err) {
    console.log('FB Auth err:',err); process.exit()
  } else {
    console.log('FB Authed successfully')
  }
})

startDispatch(fb.child('!queue'), remote, tasks)
