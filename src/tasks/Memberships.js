import Promise from 'bluebird'
import defaults from './defaults'

function actions() {
  this.add({role:'Memberships',cmd:'create'}, async function({teamKey, oppKey, engagementKey, answer}) {
    return await this.act('role:Firebase,model:Memberships,cmd:push', {values: {
      teamKey,
      oppKey,
      engagementKey,
      answer,
      isApplied: true,
      isAccepted: false,
      isConfirmed: false,
    }})
  })

  return defaults(this, 'Memberships')
    .init('remove', 'update')
}

export default actions
