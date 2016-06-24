function actions({models: {ProjectImages}}) {
  this.add({role:'ProjectImages',cmd:'set'}, ({uid, key, values}, respond) =>
    ProjectImages.child(key).set(values)
      .then(() => respond(null, {key}))
      .catch(err => respond(err)))

  this.add({role:'ProjectImages',cmd:'remove'}, ({uid, key}, respond) =>
    ProjectImages.child(key).remove()
      .then(() => respond(null, {key}))
      .catch(err => respond(err)))

  this.add({role:'Auth',model:'ProjectImages'},
    function(msg, respond) {
      this.act({
        ...msg,role:'Auth',cmd:'update',model:'Projects',
        projectKey:msg.key}, respond)
    }
  )
}

export default actions
