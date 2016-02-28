import Firebase from 'firebase'

const fb = new Firebase('http://sparks-development.firebaseio.com')

fb.child('tasks').push({
  domain: 'Profiles',
  action: 'confirm',
  client: 'SOMEUID',
  payload: {
    fullName: 'Bob Sagat',
  }
}, () => process.exit())
