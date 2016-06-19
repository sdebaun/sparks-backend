import {join, always} from 'ramda'

const joinedKeys = ({projectKey, profileKey}) =>
  join('-', [projectKey, profileKey])

function actions({auths: {userCanUpdateProject}, models: {Arrivals}}) {
  this.add({role:'Arrivals',cmd:'create'}, ({uid, values}, respond) =>
    userCanUpdateProject({uid, projectKey: values.projectKey})
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
    .then(key => respond(null, {key}))
    .catch(err => respond(err)))
}

export default actions
