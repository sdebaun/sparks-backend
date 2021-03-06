/* eslint-disable max-nested-callbacks */
import Firebase from 'firebase'
import {propEq, join, find, tap, concat, compose, curryN} from 'ramda'
import {format} from 'util'

const out = (...msg) => {
  const str = format(...msg)
  process.stderr.write(`${str}\n`)
}

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

const PROJECT = process.argv[2] || null

const PROJECT_NAMES = {
  'Northern Nights': 'NN2016',
  'Disc Jam': 'DISCJAM2016',
  'Wild Woods': 'WILDWOODS2016',
  'Cosmic Alignment': 'Cosmic2016',
  'Stilldream Festival': 'STILLDREAM2016',
}

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

const getProject = e =>
  fb.child('Opps')
    .child(e.oppKey)
    .once('value')
    .then(s => s.val())
    .then(x =>
      fb.child('Projects')
        .child(x.projectKey)
        .once('value')
        .then(s => [s.val(), e])
    )

const objToRows = obj =>
  obj && Object.keys(obj).map(k => ({$key: k, ...obj[k]})) || []

const snap = s => s.val()

function sortByName([a], [b]) {
  if (a.fullName < b.fullName) { return -1 }
  if (a.fullName > b.fullName) { return 1 }
  return 0
}

fb.child('Projects').once('value')
.then(s => s.val())
.then(objToRows)
.then(find(propEq('name', PROJECT)))
.then(tap(p => out('Found project', p.name)))
.then(project =>
  fb.child('Opps')
    .orderByChild('projectKey')
    .equalTo(project.$key)
    .once('value')
  .then(snap)
  .then(objToRows)
  .then(tap(rows => out('Found', rows.length, 'Opps')))
  .then(opps =>
    Promise.all(opps.map(opp =>
      fb.child('Engagements')
        .orderByChild('oppKey')
        .equalTo(opp.$key)
        .once('value')
      .then(snap)
      .then(objToRows)
      .then(tap(rows => out('Found', rows.length, 'Engagements')))
      .then(engs => Promise.all(engs.map(eng =>
        fb.child('Profiles').child(eng.profileKey).once('value')
        .then(snap)
        .then(profile => ({...eng, profile}))
      )))
      .then(engs =>
        ({...opp, engs})
      )
    ))
  )
)
.then(opps =>
  opps.reduce((acc, opp) =>
    concat(acc, opp.engs.map(eng =>
      [eng.profile.fullName,
        eng.profile.email,
        eng.profile.phone,
        PROJECT_NAMES[PROJECT],
        getStatusCode(eng),
        opp.name,
      ]
      .map(String)
      .map(str => format('"%s"', str))
    )),
    []
  )
)
.then(tap(rows => out('Preparing to write', rows.length, 'rows')))
.then(rows =>
  rows.map(join(','))
)
.then(lines =>
  lines.forEach(line =>
    console.log(line)
  )
)
.then(() => process.exit())
.catch(err => {
  console.error('err', err)
  process.exit()
})

//fb.child('Engagements').once('value')
//.then(snap => snap.val())
//.then(objToRows)
//.then(engagements => {
//  return Promise.all(engagements.map(getProject))
//})
//.then(projects => {
//  return projects
//    .filter(([project]) => {
//      if (PROJECT === null || project.name === PROJECT) { return true }
//      return false
//    })
//    .map(x => x[1]) // map back to just engagements
//})
//.then(engagements => {
//  // console.log(engagements.length, 'engagements count')
//  return Promise.all(
//    engagements
//      .filter(e => Boolean(e.profileKey))
//      .map(e => getProfile(e))
//  )
//})
//.then(profiles => {
//  // console.log(profiles.length, 'profile count')
//  return profiles
//    .sort(sortByName)
//    .map(([p, status]) => `"${p.fullName}", "${p.email}", "${p.phone}",
//    ${PROJECT_NAMES[PROJECT]}, "${status}"`) // eslint-disable-line
//    .filter((item, pos, ary) => {
//      return !pos || item !== ary[pos - 1]
//    })
//    .forEach(x => console.log(x))
//  // return profiles.forEach(p => console.log(p))
//})
//.then(() => process.exit())
//.catch(err => console.log('err',err))
