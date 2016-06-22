import {join, always, when} from 'ramda'

const joinedKeys = (projectKey, profileKey) =>
  join('-', [projectKey, profileKey])

function actions({auths: {userCanUpdateProject}, models: {Arrivals}}) {
  this.add(
    {role:'Arrivals',cmd:'create'},
    ({uid, profile, profileKey, projectKey}, respond) =>
      Arrivals.first('projectKeyProfileKey', joinedKeys(projectKey, profileKey))
        .catch(always(null))
        .then(when(Boolean, () => Promise.reject('Already arrived')))
        .then(() => Arrivals.push({
          projectKey,
          profileKey,
          arrivedAt: Date.now(),
          projectKeyProfileKey: joinedKeys(projectKey, profileKey),
          ownerProfileKey: profile.$key,
        }).key())
        .then(key => respond(null, {key})))

  this.wrap({role: 'Arrivals', cmd:'create'}, function(msg, respond) {
    userCanUpdateProject(msg)
      .then(data => this.prior({...msg, ...data}, respond))
      .catch(err => respond(err))
  })
}

export default actions
