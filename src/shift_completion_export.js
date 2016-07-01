import Firebase from 'firebase'
import moment from 'moment'

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
  Boogaloo: 'BMJ2016',
  'Northern Nights': 'NN2016',
  'Disc Jam': 'DISCJAM2016',
  'Wild Woods': 'WILDWOODS2016',
  'Cosmic Alignment': 'Cosmic2016',
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

const objToRows = obj =>
obj && Object.keys(obj).map(k => ({$key: k, ...obj[k]})).filter(Boolean) || []

const getProfile = engagement =>
  fb.child('Profiles')
    .child(engagement.profileKey)
    .once('value')
    .then(s => s.val())
    .then(val => [val, getStatusCode(engagement), engagement])

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

const getAssignments = ([profile, status, eng]) =>
  fb.child('Assignments')
    .orderByChild('profileKey')
    .equalTo(eng.profileKey)
    .once('value')
    .then(a => objToRows(a.val()).map(x => [x, profile, status, eng]))

const getShift = (assignments) =>
  Array.isArray(assignments) &&
  Promise.all(
    assignments.map(([assignment, ...others]) =>
      fb.child('Shifts')
        .child(assignment.shiftKey)
        .once('value')
        .then(s => s.val())
        .then(s => [s, assignment, ...others])
    ) || Promise.resolve(assignments)
  )

const getTeam = (shifts) =>
  Promise.all(
    shifts.map(([shift, assignment, ...others]) =>
      fb.child('Teams')
        .child(assignment.teamKey)
        .once('value')
        .then(t => [t.val(), shift, assignment, ...others])
    )
  )

function sortByName([a], [b]) {
  if (a.fullName < b.fullName) { return -1 }
  if (a.fullName > b.fullName) { return 1 }
  return 0
}

function filterRepeats(item, pos, ary) {
  return !pos || item !== ary[pos - 1]
}

function worked({startTime = false, endTime = false}) {
  if (startTime) {
    if (endTime) {
      return 'Complete'
    }
    return 'Started'
  } else if (endTime) {
    return 'Finished'
  }
  return 'No Show'
}

function getDay(date) {
  return moment(date).format('dddd')
}

function getDate(date) {
  return moment(date).format('MM/DD/YY')
}

function formatTime(time) {
  return moment(time).format('hh-mm-ss')
}

function format([team, shift, assignments, p, status, eng]) {
  return `"${p.fullName}", "${team.name}", "${getDay(shift.start)}", ` +
  `"${getDate(shift.start)}", "${formatTime(assignments.startTime) || 'N/A'}", ` + // eslint-disable-line max-len
  `"${formatTime(assignments.endTime) || 'N/A'}", "${worked(assignments)}", ` +
  `"${status}", "${p.email}", "${p.phone}", "${eng.profileKey}", ` +
  `"${eng.$key}", ${PROJECT_NAMES[PROJECT]}`
}

function flatten(arr) {
  let flatArr = []

  for (let i = 0; i < arr.length; ++i) {
    if (Array.isArray(arr[i][0]) && !!arr) {
      flatArr = flatArr.concat(flatten(arr[i]))
    } else if (arr[i]) {
      flatArr = [...flatArr, arr[i]]
    }
  }
  return flatArr.filter(Boolean)
}

function iterateAndLog(arr) {
  let log = [
    `"NAME", "TEAM", "DAY", "DATE", "TIME IN", "TIME OUT", "SHIFT COMPLETION", "STATUS", "EMAIL", "PHONE #", "PROFILE KEY", "ENGAGEMENT KEY", "PROJECT NAME"`, // eslint-disable-line max-len
  ]
  flatten(arr).filter(x => x.length > 0).map(format)
    .filter(filterRepeats)
    .forEach(x => {
      log = log.concat(x)
    })

  log.forEach(x => console.log(x))
}

fb.child('Engagements').once('value')
.then(snap => snap.val())
.then(objToRows)
.then(engagements => {
  return Promise.all(engagements.map(getProject))
})
.then(projects => {
  return projects
    .filter(([project]) => {
      if (PROJECT === null || project.name === PROJECT) { return true }
      return false
    })
    .map(x => x[1]) // map back to just engagements
})
.then(engagements => {
  // console.log(engagements.length, 'engagements count')
  return Promise.all(
    engagements
      .filter(e => Boolean(e.profileKey))
      .map(e => getProfile(e))
  )
})
.then(profiles => {
  // console.log(profiles.length, 'profile count')
  return Promise.resolve(
    profiles
    .sort(sortByName)
    .filter(x => x[1] === 'CONFIRMED')
  )
})
.then(profiles => {
  return Promise.all(
    profiles.map(
      (p) => getAssignments(p)
    )
  ).then(a => Promise.all(a.map(getShift))) // eslint-disable-line
   .then(s => Promise.all(s.map(getTeam)))
})
.then(x => iterateAndLog(x))
.then(() => process.exit())
.catch(err => console.log('err',err))
