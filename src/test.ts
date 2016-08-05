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

fb.authWithCustomToken(cfg.FIREBASE_TOKEN, err => {
  if (err) {
    console.log('FB Auth err:',err); process.exit()
  } else {
    console.log('FB Authed successfully')
  }
})

const PROFILES_CREATE = {
  domain: 'Profiles',
  action: 'create',
  uid: 'google:115393618569155529188', // my google uid
  payload: {
    fullName: 'Some Guy',
    email: 'my@email.com',
  },
}

const PROJECTS_CREATE = {
  domain: 'Projects',
  action: 'create',
  uid: 'google:115393618569155529188', // my google uid
  payload: {
    name: 'SagatFest',
  },
}

const PROJECTS_UPDATE = {
  domain: 'Projects',
  action: 'update',
  uid: 'google:115393618569155529188', // my google uid
  payload: {
    key: '-KFi4A-bvHb7Pp6gXUmC',
    values: {
      name: 'Sagat Fest!!!',
    },
  },
}

const TEAMS_CREATE = {
  domain: 'Teams',
  action: 'create',
  uid: 'google:115393618569155529188', // my google uid
  payload: {
    name: 'My Team',
    projectKey: '-KFi4A-bvHb7Pp6gXUmC',
  },
}

const OPPS_CREATE = {
  domain: 'Opps',
  action: 'create',
  uid: 'google:115393618569155529188', // my google uid
  payload: {
    name: 'My Opp',
    projectKey: '-KFi4A-bvHb7Pp6gXUmC',
  },
}

const FULFILLERS_CREATE = {
  domain: 'Fulfillers',
  action: 'create',
  uid: 'google:115393618569155529188', // my google uid
  payload: {
    name: 'My Fulflilers',
    projectKey: '-KFi4A-bvHb7Pp6gXUmC',
  },
}

const q = fb.child('!queue/tasks')

q.push(PROFILES_CREATE)
// .then(() =>
//   fb.child('!queue/tasks').push(PROJECTS_CREATE)
// )

// .then(() => q.push(PROJECTS_UPDATE))
.then(() => q.push(FULFILLERS_CREATE))

.then(() => process.exit())
