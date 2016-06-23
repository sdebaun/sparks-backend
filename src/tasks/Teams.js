function actions({auths: {userCanUpdateTeam, userCanUpdateProject}, models: {Teams}}) { // eslint-disable-line
  this.add({role:'Teams',cmd:'create'}, ({values, profile}, respond) => {
    const key = Teams.push({
      ...values,
      ownerProfileKey: profile.$key,
    }).key()

    respond(null, {key})
  })

  this.add({role:'Teams',cmd:'remove'}, ({key}, respond) =>
    Teams.child(key).remove()
    .then(() => respond(null, {key}))
    .catch(err => respond(err)))

  this.add({role:'Teams',cmd:'update'}, ({key, values}, respond) =>
    Teams.child(key).update(values)
    .then(() => respond(null, {key}))
    .catch(err => respond(err)))

  this.wrap({role:'Teams'}, function(msg, respond) {
    if (msg.cmd === 'create') { return this.prior(msg, respond) }

    userCanUpdateTeam({
      uid: msg.uid,
      teamKey: msg.key,
    })
    .then(data => this.prior({...msg, ...data}, respond))
    .catch(err => respond(err))
  })

  this.wrap({role:'Teams',cmd:'create'}, function(msg, respond) {
    userCanUpdateProject({
      uid: msg.uid,
      projectKey: msg.values.projectKey,
    })
    .then(data => this.prior({...msg, ...data}, respond))
    .catch(err => respond(err))
  })
}

export default actions
