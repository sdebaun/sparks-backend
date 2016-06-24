import Promise from 'bluebird'

function actions({models: {Memberships}}) {
  const act = Promise.promisify(this.act, {context: this})

  this.add({role:'Memberships',cmd:'create'}, ({teamKey, oppKey, engagementKey, answer}, respond) => {
    const key = Memberships.push({
      teamKey,
      oppKey,
      engagementKey,
      answer,
      isApplied: true,
      isAccepted: false,
      isConfirmed: false,
    }).key()

    respond(null, {key})
  })

  this.add({role:'Memberships',cmd:'remove'}, ({key, uid}, respond) =>
    act({role:'Firebase',cmd:'get',
      profile: {uid},
      membership: key,
    })
    .then(() => Memberships.child(key).remove())
    .then(() => respond(null, {key}))
    .catch(err => respond(err)))

  this.add({role:'Memberships',cmd:'update'}, ({key, values}, respond) =>
    Memberships.child(key).update(values)
    .then(() => respond(null, {key}))
    .catch(err => respond(err)))
}

export default actions
