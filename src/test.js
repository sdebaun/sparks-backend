import Firebase from 'firebase'

const fb = new Firebase('http://sparks-development.firebaseio.com')

fb.child('!queue/tasks').push({
  domain: 'Projects',
  action: 'create',
  uid: 'google:115393618569155529188', // my google uid
  payload: {
    name: 'SagatFest',
  }
}, () => process.exit())
