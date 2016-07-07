/* eslint max-nested-callbacks: 0 */
import Promise from 'bluebird'

function actions({auths: {userCanUpdateOpp, userCanUpdateProject}, models: {Engagements, Opps}}) { // eslint-disable-line
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

  this.wrap({role:'Opps'}, function(msg, respond) {
    if (msg.cmd === 'create') { return this.prior(msg, respond) }

    userCanUpdateOpp({uid: msg.uid, oppKey: msg.key})
    .then(data => this.prior({...msg, ...data}, respond))
    .catch(err => respond(err))
  })

  this.wrap({role:'Opps',cmd:'create'}, function(msg, respond) {
    userCanUpdateProject({uid: msg.uid, projectKey: msg.values.projectKey})
    .then(data => this.prior({...msg, ...data}, respond))
    .catch(err => respond(err))
  })
}

export default actions
