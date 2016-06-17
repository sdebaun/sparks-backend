import {join, always} from 'ramda'

const joinedKeys = ({projectKey, profileKey}) =>
  join('-', [projectKey, profileKey])

const create = (values, uid, {auths, models: {Arrivals}}) =>
  auths.userCanUpdateProject({uid, projectKey: values.projectKey})
  .then(data =>
    Arrivals.first('projectKeyProfileKey', joinedKeys(values))
    .catch(always(data))
    .then(arrival => arrival ? Promise.reject('Already arrived') : data)
    .then(() => Arrivals.push({
      ...values,
      arrivedAt: Date.now(),
      projectKeyProfileKey: joinedKeys(values),
      ownerProfileKey: data.profile.$key,
    }).key()))

export default {
  create,
}
