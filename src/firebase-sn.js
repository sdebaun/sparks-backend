import Firebase from 'firebase'
import {makeCollections} from './collections'
import {keys} from 'ramda'

export default function({collections, cfg: {FIREBASE_HOST, FIREBASE_TOKEN}}) {
  const fb = new Firebase(FIREBASE_HOST)
  console.log('Connected firebase to', FIREBASE_HOST)

  const models = makeCollections(fb, collections)
  models.Users = {
    set: (uid, profileKey) => fb.child('Users').child(uid).set(profileKey),
  }

  this.add({role:'Firebase'}, function(msg, respond) {
    respond(null, {fb})
  })

  this.add({role:'Firebase',cmd:'Models'}, function(msg, respond) {
    respond(null, {models})
  })

  this.add({role:'Firebase',model:'Users',cmd:'set'}, async function({uid, profileKey}) {
    return await models.Users.set(uid).set(profileKey)
  })

  const names = keys(models)
  for (let name of names) {
    const model = models[name]
    this.add({role:'Firebase',model:name,cmd:'get'}, function({key}, respond) {
      model.get(key).then(result => respond(null, result))
    })

    this.add({role:'Firebase',model:name,cmd:'first'}, function({by, value}, respond) {
      model.first(by, value).then(result => respond(null, result))
    })

    this.add({role:'Firebase',model:name,cmd:'by'}, function({by, value}, respond) {
      model.by(by, value).then(result => respond(null, result))
    })

    this.add({role:'Firebase',model:name,cmd:'update'}, function({key, values}, respond) {
      model.child(key).update(values)
        .then(() => respond(null, {key}))
        .catch(error => respond(null, {error}))
    })

    this.add({role:'Firebase',model:name,cmd:'push'}, function({values}, respond) {
      const key = model.push(values).key()
      respond(null, {key})
    })

    this.add({role:'Firebase',model:name,cmd:'remove'}, function({key}, respond) {
      if (!key) { respond(null, {error: 'no key'}) }
      model.child(key).remove()
        .then(() => respond(null, {key}))
    })
  }

  this.add({init:'firebase-sn'}, function(args, respond) {
    console.log('Authenticating firebase')
    fb.authWithCustomToken(FIREBASE_TOKEN.trim(), err => {
      console.log('Authenticated firebase')
      respond(err, {})
    })
  })

  return 'firebase-sn'
}
