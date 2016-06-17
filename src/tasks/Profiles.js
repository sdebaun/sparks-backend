import {isAdmin, isUser} from '../authorization'
import {cond, T, always} from 'ramda'

const makeUserAndProfile = (uid, values, {models: {Profiles, Users}}) => {
  const profileKey = Profiles.push({...values,
    uid,
    isAdmin: false,
    isEAP: false,
  }).key()
  Users.set(uid, profileKey)
  return profileKey
}

const create = (values, uid, {models: {Profiles, Users}}) =>
  Profiles.first('uid', uid)
  .then(profile => {
    console.log('profile',profile,values,uid)
    return !profile ?
      makeUserAndProfile(uid, values, {Profiles, Users}) :
      profile.$key
  })

const adminUpdate = profile => (values, {models: {Profiles}}) =>
  Profiles.child(profile.$key).update(values)

const userUpdate = profile => (values, {models: {Profiles}}) =>
  Profiles.child(profile.$key).update({
    ...values,
    isAdmin: profile.isAdmin,
    isEAP: profile.isEAP,
  })

const update = ({key, values}, uid, {models: {Profiles}}) =>
  Profiles.first('uid', uid)
  .then(profile =>
    cond([
      [isAdmin, adminUpdate],
      [isUser, userUpdate],
      [T, always(T)],
    ])(profile, key)
  )
  .then(fn => fn(values, {Profiles}))
  .then(() => key)

export default {
  create,
  update,
}
