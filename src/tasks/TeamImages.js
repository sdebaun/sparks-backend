function actions({models: {TeamImages}}) {
  this.add({role:'TeamImages',cmd:'set'}, ({key, uid, values}, respond) => {
    TeamImages.child(key).set(values)
      .then(() => respond(null, {key}))
      .catch(err => respond(err))
  })
}

export default actions
