import defaults from './defaults'

function actions() {
  this.wrap('role:Teams,cmd:create', async function(msg) {
    return await this.prior({...msg, values: {...msg.values, ownerProfileKey: msg.profile.$key}})
  })

  return defaults(this, 'Teams')
    .init('create', 'remove', 'update')
}

export default actions
