import {userCanUpdateProject} from './authorization'

const set = ({key, values}, uid, models) =>
  userCanUpdateProject({uid, projectKey: key}, models)
  .then(() => models.ProjectImages.child(key).set(values))
  .then(() => key)

const remove = (key, uid, models) =>
  userCanUpdateProject({uid, projectKey: key}, models)
  .then(() => models.ProjectImages.child(key).remove())

export default {
  set,
  remove,
}
