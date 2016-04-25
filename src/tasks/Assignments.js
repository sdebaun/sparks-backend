import {isAdmin, isUser} from './authorization'

export const updateCounts = (shiftKey, {Assignments, Shifts}) =>
  Assignments.by('shiftKey', shiftKey)
    .then(assignments => { console.log('found',assignments.length); return assignments.length })
    .then(assigned => Shifts.child(shiftKey).update({assigned}))

const create = (values, uid, {Profiles, Assignments, Shifts}) =>
  Profiles.first('uid', uid)
  .then(profile => Assignments.push({...values, profileKey: profile.$key}))
  .then(ref =>
    updateCounts(values.shiftKey, {Assignments, Shifts})
    .then(() => ref.key())
  )

const remove = (key, uid, {Profiles, Assignments, Shifts}) =>
  Promise.all([
    Profiles.first('uid', uid),
    Assignments.get(key),
  ])
  .then(([user, {shiftKey}]) =>
    Assignments.child(key).remove()
    .then(() => updateCounts(shiftKey, {Assignments, Shifts}))
    .then(() => key)
  )

const update = ({key, values}, uid, {Assignments}) =>
  Assignments.child(key).update(values).then(ref => key)

export default {
  create,
  remove,
  update,
}
