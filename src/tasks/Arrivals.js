import {isAdmin, isUser} from './authorization'
import {identity, prop, allPass, useWith, join, always} from 'ramda'

const userAuthorizedForProject = allPass([
  isAdmin,
  useWith(isUser, [identity, prop('ownerProfileKey')]),
])

const joinedKeys = ({projectKey, profileKey}) =>
  join('-', [projectKey, profileKey])

const create = (values, uid, {Arrivals, Profiles, Projects}) =>
  Promise.all([
    Profiles.first('uid', uid),
    Projects.get(values.projectKey),
  ])
  .then(([user, project]) =>
    userAuthorizedForProject(user, project) ?
      user :
      Promise.reject('Unauthorized'))
    .then(user =>
      Arrivals.first('projectKeyProfileKey', joinedKeys(values))
      .then(arrival => arrival ? Promise.reject('Already arrived') : user)
      .catch(always(user))
    )
    .then(user => Arrivals.push({
      ...values,
      arrivedAt: Date.now(),
      projectKeyProfileKey: joinedKeys(values),
      ownerProfileKey: user.$key,
    }).key())

export default {
  create,
}
