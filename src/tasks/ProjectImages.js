const set = ({key, values}, uid, {models, auths}) =>
  auths.userCanUpdateProject({uid, projectKey: key})
  .then(() => models.ProjectImages.child(key).set(values))
  .then(() => key)

const remove = (key, uid, {models, auths}) =>
  auths.userCanUpdateProject({uid, projectKey: key})
  .then(() => models.ProjectImages.child(key).remove())

export default {
  set,
  remove,
}
