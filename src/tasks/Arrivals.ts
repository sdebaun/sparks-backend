import {join} from 'ramda'
import defaults from './defaults'

const joinedKeys = (projectKey, profileKey) =>
  join('-', [projectKey, profileKey])

function Arrivals() {
  this.add('role:Arrivals,cmd:create', async function({profile, profileKey, projectKey}):Promise<TaskResponse> {
    const {arrival} = await this.act({role:'Firebase',cmd:'get',
      arrival: {projectKeyProfileKey: joinedKeys(projectKey, profileKey)},
    })

    if (arrival) { return {error: 'Already arrived'} }

    const {key} = await this.act('role:Firebase,model:Arrivals,cmd:push', {values:{
      projectKey,
      profileKey,
      arrivedAt: Date.now(),
      projectKeyProfileKey: joinedKeys(projectKey, profileKey),
      ownerProfileKey: profile.$key,
    }})

    return {key}
  })
}

export default defaults(Arrivals)
