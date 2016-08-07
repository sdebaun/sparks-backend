import defaults from './defaults'
import {merge} from 'ramda'

function Projects() {
  this.add('role:Projects,cmd:create', async function({profile, values}) {
    return await this.act('role:Firebase,model:Projects,cmd:push', {values: merge(
      values,
      {ownerProfileKey: profile.$key}
    )})
  })
}

export default defaults(Projects, 'remove', 'update')
