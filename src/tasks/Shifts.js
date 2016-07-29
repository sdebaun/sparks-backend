import defaults from './defaults'

function Shifts() {
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
}

export default defaults(Shifts, 'create', 'update', 'remove')

