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

const project = process.argv[2] || null

const fb = new Firebase(cfg.FIREBASE_HOST)

// fb.authWithCustomToken(cfg.FIREBASE_TOKEN, err => {
//   if (err) {
//     console.log('FB Auth err:',err); process.exit()
//   } else {
//     console.log('FB Authed successfully')
//   }
// })

function getStatusCode(engagement) {
  const {
    isApplied = false,
    isAccepted = false,
    isConfirmed = false,
    declined = false,
  } = engagement

  if (declined) {
    return 'REJECTED'
  }

  if (isApplied) {
    if (isAccepted) {
      if (isConfirmed) {
        return 'CONFIRMED'
      }
      return 'APPROVED'
    }
    return 'APPLIED'
  }
}

const getProfile = engagement =>
  fb.child('Profiles')
    .child(engagement.profileKey)
    .once('value')
    .then(s => s.val())
    .then(val => [val, getStatusCode(engagement)])

const objToRows = obj =>
  obj && Object.keys(obj).map(k => ({$key: k, ...obj[k]})) || []

function sortByName([a], [b]) {
  if (a.fullName < b.fullName) { return -1 }
  if (a.fullName > b.fullName) { return 1 }
  return 0
}

fb.child('Engagements').once('value')
.then(snap => snap.val())
.then(objToRows)
.then(engagements => {
  console.log(engagements.length, 'engagements count')
  return Promise.all(
    engagements
      .filter(e => {
        if (project === null) {
          return true
        }
        return e && e.opp && e.opp.project && e.opp.project.name === project
      })
      .filter(e => Boolean(e.profileKey))
      .map(e => getProfile(e))
  )
})
.then(profiles => {
  console.log(profiles.length, 'profile count')
  return profiles
    .sort(sortByName)
    .forEach(([p, status]) => console.log(`"${p.fullName}", "${p.email}", "${p.phone}", "BMJ2016", "${status}"`)) // eslint-disable-line
  // return profiles.forEach(p => console.log(p))
})
.then(() => process.exit())
.catch(err => console.log('err',err))
