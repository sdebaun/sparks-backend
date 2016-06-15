import {prop, propEq, always} from 'ramda'
import {getStuff} from '../util'

export const updateCounts = (shiftKey, {Assignments, Shifts}) =>
  Assignments.by('shiftKey', shiftKey)
    .then(prop('length'))
    .then(assigned => Shifts.child(shiftKey).update({assigned}))

const create = (values, uid, {Profiles, Assignments, Shifts}) =>
  Profiles.first('uid', uid)
  // .then(profile => Assignments.push({...values, profileKey: profile.$key}))
  .then(() => Assignments.push(values))
  .then(ref =>
    updateCounts(values.shiftKey, {Assignments, Shifts})
    .then(() => ref.key()))

const updateAssignmentStatus = (eKey, models) =>
  Promise.all([
    models.Engagements.get(eKey),
    models.Assignments.get(eKey),
  ])
  .then(([eng,assigns]) =>
    models.Commitments.by('oppKey', eng.oppKey)
      .then(commits => commits.find(propEq('code', 'shifts')))
      .then(shiftCommit => shiftCommit ? parseInt(shiftCommit.count,10) : 0)
      .then(assignReq => eng.isAssigned ? assignReq === assigns.length : false)
      .then(isAssigned => models.Engagements.child(eKey).update({isAssigned}))
  )

const remove = (key, uid, models) =>
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

const update = ({key, values}, uid, {Assignments}) =>
  Assignments.child(key).update(values).then(always(key))

export default {
  create,
  remove,
  update,
}
