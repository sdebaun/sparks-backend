const set = ({key, values}, uid, {models, auths, getStuff}) =>
  getStuff({
    team: key,
  })
  .then(({team}) =>
    auths.userCanUpdateProject({uid, projectKey: team.projectKey}))
  .then(() =>
    models.TeamImages.child(key).set(values) && key)

export default {
  set,
}
