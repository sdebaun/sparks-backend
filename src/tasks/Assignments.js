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

const updateAssignmentStatus = (eKey, {Engagements, Commitments, Assignments}) =>
  Promise.all([
    Engagements.get(eKey),
    Assignments.get(eKey),
  ])
  .then(([eng,assigns]) =>
    Commitments.by('oppKey', eng.oppKey)
      .then(commits => commits.find(c => c.code === 'shifts'))
      .then(shiftCommit => shiftCommit ? parseInt(shiftCommit.count,10) : 0)
      .then(assignReq => eng.isAssigned ? assignReq === assigns.length : false)
      .then(isAssigned => Engagements.child(eKey).update({isAssigned}))
  )

const remove = (key, uid, {Profiles, Assignments, Shifts, Engagements, Commitments}) =>
  Promise.all([
    Profiles.first('uid', uid),
    Assignments.get(key),
  ])
  .then(([user, {shiftKey, engagementKey}]) =>
    Assignments.child(key).remove()
    .then(() => updateCounts(shiftKey, {Assignments, Shifts}))
    .then(() => updateAssignmentStatus(engagementKey, {Engagements, Commitments, Assignments}))
    .then(() => key)
  )

const update = ({key, values}, uid, {Assignments}) =>
  Assignments.child(key).update(values).then(ref => key)

export default {
  create,
  remove,
  update,
}
