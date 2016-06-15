import {userCanUpdateProject, userCanUpdateTeam} from './authorization'
import {always} from 'ramda'

const create = (values, uid, models) =>
  userCanUpdateProject({uid, projectKey: values.projectKey}, models)
  .then(({profile}) =>
    models.Teams.push({
      ...values,
      ownerProfileKey: profile.$key,
    }).key())

const remove = (key, uid, models) =>
  userCanUpdateTeam({uid, teamKey: key}, models)
  .then(() => models.Teams.child(key).remove())
  .then(always(key))

const update = ({key, values}, uid, models) =>
  userCanUpdateTeam({uid, teamKey: key}, models)
  .then(() => models.Teams.child(key).update(values))
  .then(always(key))

export default {
  create,
  remove,
  update,
}
