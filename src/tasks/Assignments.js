import Promise from 'bluebird'
import {propEq, prop, identity, ifElse} from 'ramda'

function actions({models}) {
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
    act({role:'Firebase',cmd:'get',
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
    act({role:'Firebase',cmd:'get',
      assignment: key,
    })
    .then(({assignment}) =>
      models.Assignments.child(key).remove().then(() => assignment)
    )
    .then(
      ifElse(
        prop('shiftKey'),
        assignment =>
          act({
            role:'Shifts',
            cmd:'updateCounts',
            key:assignment.shiftKey,
          }).then(() => assignment),
        identity
      )
    )
    .then(assignment => updateAssignmentStatus(assignment.engagementKey))
    .then(() => respond(null, {key}))
    .catch(err => respond(err)))

  this.add({role:'Assignments',cmd:'update'}, ({key, values}, respond) =>
    Assignments.child(key).update(values)
    .then(() => respond(null, {key}))
    .catch(err => respond(err)))

  async function updateEngagement(assignmentKey, by) {
    const assignment = await act({role:'Firebase',model:'Assignments',cmd:'get',assignmentKey})
    return await this.act({role:'Engagements',cmd:'updateAssignmentCount', key: assignment.engagementKey, by})
  }

  this.wrap({role:'Assignments',cmd:'remove'}, async function(msg) {
    updateEngagement(msg.key, -1)
    return await this.prior(msg)
  })

  this.wrap({role:'Assignments',cmd:'create'}, async function(msg) {
    const response = await this.prior(msg)
    updateEngagement(response.key, 1)
    return response
  })

  return {
    name: 'Assignments',
  }
}

export default actions
