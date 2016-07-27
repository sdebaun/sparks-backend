function actions({models: {Memberships}, getStuff}) {
  this.add({role:'Memberships',cmd:'create'}, ({teamKey, oppKey, engagementKey, answer}, respond) => { // eslint-disable-line max-len
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
    getStuff({
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
