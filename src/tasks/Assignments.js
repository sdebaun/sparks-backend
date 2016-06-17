import {prop, propEq, always} from 'ramda'

export const updateCounts = (shiftKey, {models: {Assignments, Shifts}}) =>
  Assignments.by('shiftKey', shiftKey)
    .then(prop('length'))
    .then(assigned => Shifts.child(shiftKey).update({assigned}))

const create = (values, uid, {models: {Profiles, Assignments, Shifts}}) =>
  Profiles.first('uid', uid)
  .then(() => Assignments.push(values))
  .then(ref =>
    updateCounts(values.shiftKey, {Assignments, Shifts})
    .then(() => ref.key()))

const updateAssignmentStatus = (eKey, {getStuff, models}) =>
  getStuff({
    engagement: eKey,
    assignment: eKey,
  })
  .then(({engagement,assignment}) =>
    models.Commitments.by('oppKey', engagement.oppKey)
    .then(commits =>
      commits.find(propEq('code', 'shifts')))
      .then(shiftCommit =>
        shiftCommit ? parseInt(shiftCommit.count,10) : 0)
      .then(assignReq =>
        engagement.isAssigned ? assignReq === assignment.length : false)
      .then(isAssigned =>
        models.Engagements.child(eKey).update({isAssigned}))
  )

const remove = (key, uid, {models, getStuff}) =>
  getStuff(models)({
    profile: {uid},
    assignment: key,
  })
  .then(({assignment: {shiftKey, engagementKey}}) =>
    models.Assignments.child(key).remove()
    .then(() => updateCounts(shiftKey, models))
    .then(() => updateAssignmentStatus(engagementKey, models))
    .then(() => key)
  )

const update = ({key, values}, uid, {models: {Assignments}}) =>
  Assignments.child(key).update(values).then(always(key))

export default {
  create,
  remove,
  update,
}
