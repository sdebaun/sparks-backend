function actions({models: {Teams}}) {
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
}

export default actions
