import {isAdmin, isUser} from './authorization'

const create = (values, uid, {Profiles, Assignments, Projects}) =>
  Profiles.first('uid', uid)
  .then(profile =>
    Assignments.push({...values, profileKey: profile.$key}).then(ref => ref.key())
  )

const remove = (key, uid, {Profiles, Assignments, Projects}) =>
  Promise.all([
    Profiles.first('uid', uid),
    Assignments.get(key),
  ])
  .then(([user, fulfiller]) =>
    Assignments.child(key).remove() && key
  )

const update = ({key, values}, uid, {Assignments}) =>
  Assignments.child(key).update(values).then(ref => key)

export default {
  create,
  remove,
  update,
}
