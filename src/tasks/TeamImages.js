function actions({auths: {userCanUpdateProject}, models: {TeamImages}, getStuff}) {
  this.add({role:'TeamImages',cmd:'set'}, ({key, uid, values}, respond) => {
    getStuff({
      team: key,
    })
    .then(({team}) =>
      userCanUpdateProject({uid, projectKey: team.projectKey}))
    .then(() =>
      TeamImages.child(key).set(values))
    .then(() => respond(null, {key}))
    .catch(err => respond(err))
  })
}

export default actions
