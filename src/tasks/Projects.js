function actions({auths: {userCanCreateProject, userCanRemoveProject, userCanUpdateProject}, models: {Projects}}) {
  this.add({role:'Projects',cmd:'create'}, ({uid, values}, respond) =>
    userCanCreateProject({uid})
    .then(({profile}) =>
      Projects.push({
        ...values,
        ownerProfileKey: profile.$key,
      }).key())
    .then(key => respond(null, {key}))
    .catch(err => respond(err)))

  this.add({role:'Projects',cmd:'remove'}, ({uid,key}, respond) =>
    userCanRemoveProject({uid, projectKey: key})
    .then(() => Projects.child(key).remove())
    .then(() => respond(null, {key}))
    .catch(err => respond(err)))

  this.add({role:'Projects',cmd:'update'}, ({uid, key, values}, respond) =>
    userCanUpdateProject({uid, projectKey: key})
    .then(() => Projects.child(key).update(values))
    .then(() => respond(null, {key}))
    .catch(err => respond(err)))
}

export default actions
