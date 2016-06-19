import Promise from 'bluebird'
import {propEq} from 'ramda'

function actions({getStuff, models}) {
  const {Profiles, Assignments} = models
  const act = Promise.promisify(this.act, {context: this})

  this.add({role:'Assignments',cmd:'create'}, ({values, uid}, respond) =>
    Profiles.first('uid', uid)
    .then(() => Assignments.push(values))
    .then(ref =>
      act({role:'Shifts',cmd:'updateCounts',key:values.shiftKey})
      .then(() => ref.key()))
    .then(key => respond(null, {key}))
    .catch(err => respond(err)))

  const updateAssignmentStatus = eKey =>
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

  this.add({role:'Assignments',cmd:'remove'}, ({key, uid}, respond) =>
    getStuff({
      profile: {uid},
      assignment: key,
    })
    .then(({assignment: {shiftKey, engagementKey}}) =>
      models.Assignments.child(key).remove()
      .then(() => act({
        role:'Shifts',
        cmd:'updateCounts',
        key:shiftKey,
      }))
      .then(() => updateAssignmentStatus(engagementKey))
    )
    .then(() => respond(null, {key}))
    .catch(err => respond(err)))

  this.add({role:'Assignments',cmd:'update'}, ({key, values}, respond) =>
    Assignments.child(key).update(values)
    .then(() => respond(null, {key}))
    .catch(err => respond(err)))
}

export default actions
