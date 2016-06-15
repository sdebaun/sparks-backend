import {
  userCanCreateProject,
  userCanUpdateProject,
  userCanRemoveProject,
} from './authorization'

const create = (values, uid, models) =>
  userCanCreateProject({uid}, models)
  .then(({profile}) => models.Projects.push({
    ...values,
    ownerProfileKey: profile.$key,
  }).key())

const remove = (key, uid, models) =>
  userCanRemoveProject({uid, projectKey: key}, models)
  .then(() => models.Projects.child(key).remove() && key)

const update = ({key, values}, uid, models) =>
  userCanUpdateProject({uid, projectKey: key}, models)
  .then(() => models.Projects.child(key).update(values) && key)

export default {
  create,
  remove,
  update,
}
