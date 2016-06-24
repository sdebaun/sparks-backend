function actions({models: {Projects}}) {
  this.add({role:'Projects',cmd:'create'},
    ({uid, profile, values}, respond) => {
      const key = Projects.push({
        ...values,
        ownerProfileKey: profile.$key,
      }).key()

      respond(null, {key})
    })

  this.add({role:'Projects',cmd:'remove'}, ({uid, key}, respond) =>
    Projects.child(key).remove()
      .then(() => respond(null, {key}))
      .catch(err => respond(err)))

  this.add({role:'Projects',cmd:'update'}, ({uid, key, values}, respond) =>
    Projects.child(key).update(values)
      .then(() => respond(null, {key}))
      .catch(err => respond(err)))
}

export default actions
