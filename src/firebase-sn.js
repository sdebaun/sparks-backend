import Firebase from 'firebase'
import {getStuff} from './util'
import {makeCollections} from './collections'
import {omit, keys} from 'ramda'

export default function({collections, cfg: {FIREBASE_HOST, FIREBASE_TOKEN}}) {
  const fb = new Firebase(FIREBASE_HOST)
  console.log('Connected firebase to', FIREBASE_HOST)

  const models = makeCollections(fb, collections)
  models.Users = {
    set: (uid, profileKey) => fb.child('Users').child(uid).set(profileKey),
  }

  const scopedGetStuff = getStuff(models)

  this.add({role:'Firebase'}, function(msg, respond) {
    respond(null, {fb})
  })

  this.add({role:'Firebase',cmd:'Models'}, function(msg, respond) {
    respond(null, {models})
  })

  this.add({role:'Firebase',cmd:'get'}, function(msg, respond) {
    scopedGetStuff(omit(['role','cmd'], msg))
      .then(stuff => respond(null, stuff))
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
