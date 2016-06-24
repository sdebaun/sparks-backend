/* eslint max-nested-callbacks: 0 */
import Promise from 'bluebird'

function actions({models: {Engagements, Opps}}) { // eslint-disable-line
  const act = Promise.promisify(this.act, {context: this})

  const getAcceptedApplicants = oppKey =>
    Engagements.by('oppKey', oppKey)
    .then(engagements => engagements.filter(e => e.isAccepted))

  const checkAndSendAcceptanceEmail = (key, {confirmationsOn}, uid, opp) => { // eslint-disable-line
    // confirmations are being turned on
    if (confirmationsOn && !opp.hasOwnProperty(confirmationsOn)) {
      process.nextTick(() => {
        getAcceptedApplicants(key)
          .then(engagements => {
            engagements.forEach(a => {
              act({
                role:'email',
                cmd:'getInfo',
                key: a.$key,
                profileKey: a.profileKey,
                uid,
                oppKey: key,
              })
              .then(info =>
                act({
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

  this.add({role:'Opps',cmd:'create'}, ({values, profile}, respond) => {
    const key = Opps.push({
      ...values,
      ownerProfileKey: profile.$key,
    }).key()

    respond(null, {key})
  })

  this.add({role:'Opps',cmd:'remove'}, ({key}, respond) =>
    Opps.child(key).remove()
    .then(() => respond(null, {key}))
    .catch(err => respond(err)))

  this.add({role:'Opps',cmd:'update'}, ({key, values, uid, opp}, respond) =>
    console.log('opp update', values) ||
    Opps.child(key).update(values)
    .then(() => checkAndSendAcceptanceEmail(key, values, uid, opp))
    .then(() => respond(null, {key}))
    .catch(err => respond(err)))

  this.add({role:'Auth',cmd:'create',model:'Opps'}, function(msg, respond) {
    this.act({
      ...msg,role:'Auth',cmd:'update',model:'Projects',
      projectKey: msg.values.projectKey}, respond)
  })
}

export default actions
