import Firebase from 'firebase'

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

const fb = new Firebase(cfg.FIREBASE_HOST)

// fb.authWithCustomToken(cfg.FIREBASE_TOKEN, err => {
//   if (err) {
//     console.log('FB Auth err:',err); process.exit()
//   } else {
//     console.log('FB Authed successfully')
//   }
// })

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
      .filter(e => (e.priority || e.isAccepted) && !e.isConfirmed)
      .map(e => getProfile(e.profileKey))
  )
})
.then(profiles => {
  console.log(profiles.length, 'profile count')
  return profiles.forEach(p => console.log(`"${p.fullName}","${p.email}","${p.phone}","BMJ2016","NOTCONFIRMED"`))
  // return profiles.forEach(p => console.log(p))
})
.then(() => process.exit())
.catch(err => console.log('err',err))
