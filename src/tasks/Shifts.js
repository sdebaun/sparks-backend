import Promise from 'bluebird'
import {prop} from 'ramda'

function actions({auths: {userCanUpdateTeam}, models, getStuff}) {
  const {Shifts, Assignments} = models
  const act = Promise.promisify(this.act, {context: this})

  this.add({role:'Shifts',cmd:'updateCounts'}, ({key}, respond) =>
    Assignments.by('shiftKey', key)
      .then(prop('length'))
      .then(assigned => Shifts.child(key).update({assigned})
        .then(() => respond(null, {assigned})))
      .catch(err => respond(err)))

  this.add({role:'Shifts',cmd:'create'}, ({values, profile}, respond) => {
    const key = Shifts.push({
      ...values,
      ownerProfileKey: profile.$key,
    }).key()

    respond(null, {key})
  })

  this.add({role:'Shifts',cmd:'remove'}, ({key}, respond) =>
    Shifts.child(key).remove()
    .then(() => respond(null, {key}))
    .catch(err => respond(err)))

  this.add({role:'Shifts',cmd:'update'}, ({key, values}, respond) =>
    Shifts.child(key).update(values)
    .then(() => act({
      role:'Shifts',
      cmd:'updateCounts',
      key:key,
    }))
    .then(() => respond(null, {key}))
    .catch(err => respond(err)))

  this.wrap({role:'Shifts'}, function(msg, respond) {
    if (msg.cmd === 'create') { return this.prior(msg, respond) }

    return getStuff({
      shift: msg.key,
    })
    .then(({shift}) =>
      userCanUpdateTeam({
        uid: msg.uid,
        teamKey: shift.teamKey,
      }))
    .then(data => this.prior({...msg, ...data}, respond))
    .catch(err => respond(err))
  })

  this.wrap({role:'Shifts',cmd:'create'}, function(msg, respond) {
    userCanUpdateTeam({
      uid: msg.uid,
      teamKey: msg.values.teamKey,
    })
    .then(data => this.prior({...msg, ...data}, respond))
    .catch(err => respond(err))
  })
}

export default actions
