function actions({auths: {userCanUpdateProject}, models: {ProjectImages}}) {
  this.add({role:'ProjectImages',cmd:'set'}, ({uid, key, values}, respond) =>
    userCanUpdateProject({uid, projectKey: key})
      .then(() => ProjectImages.child(key).set(values))
      .then(() => respond(null, {key}))
      .catch(err => respond(err)))

  this.add({role:'ProjectImages',cmd:'remove'}, ({uid, key}, respond) =>
    userCanUpdateProject({uid, projectKey: key})
    .then(() => ProjectImages.child(key).remove())
    .then(() => respond(null, {key}))
    .catch(err => respond(err)))
}

export default actions
