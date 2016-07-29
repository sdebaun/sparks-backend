import Promise from 'bluebird'
import {join, always, when, prop} from 'ramda'
import defaults from './defaults'

const joinedKeys = (projectKey, profileKey) =>
  join('-', [projectKey, profileKey])

function Arrivals() {
  this.add(
    {role:'Arrivals',cmd:'create'},
    ({uid, profile, profileKey, projectKey}, respond) =>
      this.act({role:'Firebase',cmd:'get',
        arrival: {projectKeyProfileKey: joinedKeys(projectKey, profileKey)}})
        .then(prop('arrival'))
        .catch(always(null))
        .then(when(Boolean, () => Promise.reject('Already arrived')))
        .then(() => this.act('role:Firebase,model:Arrivals,cmd:push', {values:{
          projectKey,
          profileKey,
          arrivedAt: Date.now(),
          projectKeyProfileKey: joinedKeys(projectKey, profileKey),
          ownerProfileKey: profile.$key,
        }}))
        .then(({key}) => respond(null, {key})))
}

export default defaults(Arrivals)
