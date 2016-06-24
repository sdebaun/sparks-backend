import Promise from 'bluebird'
import {join, always, when, prop} from 'ramda'

const joinedKeys = (projectKey, profileKey) =>
  join('-', [projectKey, profileKey])

function actions({models: {Arrivals}}) {
  const act = Promise.promisify(this.act, {context: this})

  this.add(
    {role:'Auth',cmd:'create',model:'Arrivals'}, function(msg, respond) {
      this.act({...msg,role:'Auth',cmd:'update',model:'Teams'}, respond)
    }
  )

  this.add(
    {role:'Arrivals',cmd:'create'},
    ({uid, profile, profileKey, projectKey}, respond) =>
      act({role:'Firebase',cmd:'get',
        arrival: {projectKeyProfileKey: joinedKeys(projectKey, profileKey)}})
        .then(prop('arrival'))
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
}

export default actions
