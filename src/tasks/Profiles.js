import {isAdmin, isUser} from './authorization'
import {ifElse, identity, tap, flip, curryN, __ as _, propOr} from 'ramda'

// const create = (values, uid, {Profiles}) =>
//   Profiles.first('uid', uid)
//   .then(profile =>
//     !profile ?
//     Profiles.push({...values,
//       uid,
//       isAdmin: false,
//       isEAP: false,
//     }).key() :
//     profile.$key
//   )

const setUserToProfile = curryN(3, (uid, profileKey, {Users}) =>
  tap(() => Users.set(uid, profileKey), profileKey))

const makeUserAndProfile = (uid, values, {Profiles, Users}) =>
  flip(tap)(
    Profiles.push({...values,
      uid,
      isAdmin: false,
      isEAP: false,
    }).key,
    setUserToProfile(uid, _, {Users}))

const create = (values, uid, {Profiles, Users}) =>
  Profiles.first('uid', uid)
  .then(propOr(null, '$key'))
  .then(
    ifElse(identity,
      setUserToProfile(uid, _, {Users}),
      () => makeUserAndProfile(uid, values, {Profiles, Users}),
    ))

const update = ({key, values}, uid, {Profiles}) =>
  Profiles.first('uid', uid)
  .then(profile =>
    isAdmin(profile) && Profiles.child(key).update(values) && key ||
    isUser(profile,key) && Profiles.child(key).update({...values,
      isAdmin: profile.isAdmin,
      isEAP: profile.isAdmin,
    }) && key
  )

export default {
  create,
  update,
}
