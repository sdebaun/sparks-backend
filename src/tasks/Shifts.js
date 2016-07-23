import defaults from './defaults'

function actions() {
  this.wrap('role:Shifts,cmd:create', async function(msg) {
    return await this.prior({...msg, values: {...msg.values, ownerProfileKey: msg.profile.$key}})
  })

  this.wrap('role:Shifts,cmd:update', async function(msg) {
    const {key} = await this.prior(msg)
    await this.act('role:Shifts,cmd:updateCounts', {key})
    return {key}
  })

  this.add({role:'Shifts',cmd:'updateCounts'}, async function({key}) {
    const {assignments} = await this.act({role:'Firebase',cmd:'get',
      assignments: {shiftKey: key},
    })

    // TODO: use transaction?
    await this.act('role:Firebase,model:Shifts,cmd:update', {key, values: {
      assigned: assignments.length,
    }})

    return {assigned: assignments.length}
  })

  return defaults(this, 'Shifts')
    .init('create', 'update', 'remove')
}

export default actions
