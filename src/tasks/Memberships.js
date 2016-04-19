import {isAdmin, isUser} from './authorization'

const create = (values, uid, {Profiles, Memberships, Projects}) =>
  Memberships.push({...values,
    isApplied: true,
    isAccepted: false,
    isConfirmed: false,      
  }).then(ref => ref.key())

const remove = (key, uid, {Profiles, Memberships, Projects}) =>
  Promise.all([
    Profiles.first('uid', uid),
    Memberships.get(key),
  ])
  .then(([user, fulfiller]) =>
    Memberships.child(key).remove() && key
  )

const update = ({key, values}, uid, {Memberships}) =>
  Memberships.child(key).update(values).then(ref => key)

export default {
  create,
  remove,
  update,
}
