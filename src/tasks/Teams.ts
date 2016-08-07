import defaults from './defaults'
import {merge} from 'ramda'

function Teams() {
  this.wrap('role:Teams,cmd:create', async function(msg) {
    return await this.prior(merge(msg, {values: merge(msg.values, {ownerProfileKey: msg.profile.$key})}))
  })
}

export default defaults(Teams, 'create', 'remove', 'update')
