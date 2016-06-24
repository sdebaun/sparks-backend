import Promise from 'bluebird'

function actions({models: {Commitments}}) {
  const act = Promise.promisify(this.act, {context: this})

  this.add({role:'Commitments',cmd:'create'}, ({values, uid}, respond) => {
    console.log('create commitment', values)
    const key = Commitments.push(values).key()
    respond(null, {key})
  })

  this.add({role:'Commitments',cmd:'remove'}, ({key, uid}, respond) =>
    act({role:'Firebase',cmd:'get',
      profile: {uid},
      commitment: key,
    })
    .then(() => Commitments.child(key).remove())
    .then(() => respond(null, {key}))
    .catch(err => respond(err)))

  this.add({role:'Commitments',cmd:'update'}, ({key, values}, respond) =>
    Commitments.child(key).update(values)
    .then(() => respond(null, {key}))
    .catch(err => respond(err)))
}

export default actions
