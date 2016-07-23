/* eslint max-nested-callbacks: 0 */
import defaults from './defaults'

function actions() {
  const seneca = this

  async function getAcceptedApplicants(oppKey) {
    const {engagements} = await seneca.act('role:Firebase,cmd:get', {engagements: {oppKey}})
    return engagements.filter(e => e.isAccepted)
  }

  // TODO: rewrite this
  const checkAndSendAcceptanceEmail = (key, {confirmationsOn}, uid, opp) => { // eslint-disable-line
    // confirmations are being turned on
    if (confirmationsOn && !opp.hasOwnProperty(confirmationsOn)) {
      process.nextTick(() => {
        getAcceptedApplicants(key)
          .then(engagements => {
            engagements.forEach(a => {
              seneca.act({
                role:'email',
                cmd:'getInfo',
                key: a.$key,
                profileKey: a.profileKey,
                uid,
                oppKey: key,
              })
              .then(info =>
                seneca.act({
                  role:'email',
                  cmd:'send',
                  email:'engagement',
                  templateId: 'dec62dab-bf8e-4000-975a-0ef6b264dafe',
                  subject: 'Application accepted for',
                  ...info,
                }))
            })
          })
      })
    }
    return true
  }

  this.add({role:'Opps',cmd:'create'}, async function({values, profile}) {
    return await this.act('role:Firebase,model:Opps,cmd:create', {values: {
      ...values,
      ownerProfileKey: profile.$key,
    }})
  })

  this.add({role:'Opps',cmd:'update'}, async function({key, values, uid, opp}) {
    console.log('opp update', values)

    await this.act('role:Firebase,model:Opps,cmd:update', {key, values})
    await checkAndSendAcceptanceEmail(key, values, uid, opp)

    return {key}
  })

  return defaults(this, 'Opps')
    .init('remove')
}

export default actions
