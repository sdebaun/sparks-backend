import {omit} from 'ramda'

function action({models: {Profiles, Users}, getStuff}) {
  const makeUserAndProfile = (uid, values) => {
    const profileKey = Profiles.push({...values,
      uid,
      isAdmin: false,
      isEAP: false,
    }).key()

    return Users.set(uid, profileKey).then(() => profileKey)
  }

  this.add({role:'Profiles',cmd:'create'}, ({uid, values}, respond) =>
    Profiles.first('uid', uid)
    .then(profile =>
      profile ? profile.$key : makeUserAndProfile(uid, values))
    .then(key => respond(null, {key}))
    .catch(err => respond(err)))

  this.add({role:'Profiles',cmd:'update',admin:true},
          ({key, values}, respond) =>
    Profiles.child(key).update(values)
    .then(() => respond(null, {key}))
    .catch(err => respond(err)))

  this.add({role:'Profiles',cmd:'update',admin:false},
          ({key, values, uid}, respond) =>
    getStuff({profile: {uid}})
    .then(({profile}) =>
      profile.$key === key ?
      true :
      Promise.reject('User cannot update the profile of another user'))
    .then(() =>
      Profiles.child(key).update(omit(['isAdmin', 'isEAP'], values)))
    .then(() => respond(null, {key}))
    .catch(err => respond(err)))

  this.add({role:'Profiles',cmd:'update'}, (msg, respond) =>
    getStuff({profile: {uid: msg.uid}})
    .then(({profile}) =>
    this.act({
      ...msg,
      role:'Profiles',
      cmd:'update',
      admin:profile.isAdmin,
    }, respond))
    .catch(err => respond(err)))
}

export default action
