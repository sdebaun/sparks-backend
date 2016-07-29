import defaults from './defaults'

function Memberships() {
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
}

export default defaults(Memberships, 'remove', 'update')
