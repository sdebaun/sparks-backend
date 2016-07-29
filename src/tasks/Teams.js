import defaults from './defaults'

function Teams() {
  this.wrap('role:Teams,cmd:create', async function(msg) {
    return await this.prior({...msg, values: {...msg.values, ownerProfileKey: msg.profile.$key}})
  })
}

export default defaults(Teams, 'create', 'remove', 'update')
