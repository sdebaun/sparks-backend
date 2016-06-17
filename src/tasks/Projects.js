const create = (values, uid, {models, auths}) =>
  auths.userCanCreateProject({uid})
  .then(({profile}) => models.Projects.push({
    ...values,
    ownerProfileKey: profile.$key,
  }).key())

const remove = (key, uid, {models, auths}) =>
  auths.userCanRemoveProject({uid, projectKey: key})
  .then(() => models.Projects.child(key).remove() && key)

const update = ({key, values}, uid, {models, auths}) =>
  auths.userCanUpdateProject({uid, projectKey: key})
  .then(() => models.Projects.child(key).update(values) && key)

export default {
  create,
  remove,
  update,
}
