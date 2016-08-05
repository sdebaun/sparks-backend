/* eslint max-nested-callbacks: 0 */
import defaults from './defaults'

function Opps() {
  const seneca = this

  async function getAcceptedApplicants(oppKey) {
    const {engagements} = await seneca.act('role:Firebase,cmd:get', {engagements: {oppKey}})
    return engagements.filter(e => e.isAccepted)
  }

  // confirmations are being turned on
  async function sendAcceptanceEmails(key) {
    const engagements = await getAcceptedApplicants(key)

    engagements.forEach(a => {
      seneca.act({
        role:'email',
        cmd:'send',
        email:'engagement',
        templateId: 'dec62dab-bf8e-4000-975a-0ef6b264dafe',
        subject: 'Application accepted for',
        profileKey: a.profileKey,
        oppKey: key,
      })
    })
    return true
  }

  this.wrap('role:Opps,cmd:create', async function(msg) {
    msg.values.ownerProfileKey = msg.profile.$key
    return await this.prior(msg)
  })

  this.add({role:'Opps',cmd:'update'}, async function({key, values, opp}) {
    console.log('opp update', values)

    await this.act('role:Firebase,model:Opps,cmd:update', {key, values})

    if (values.confirmationsOn && !opp.hasOwnProperty('confirmationsOn')) {
      await sendAcceptanceEmails(key)
    }

    return {key}
  })
}

export default defaults(Opps, 'create', 'remove')
