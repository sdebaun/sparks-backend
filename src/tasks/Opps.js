/* eslint max-nested-callbacks: 0 */
import {getEmailInfo, sendEngagmentEmail} from './emails'
import {always} from 'ramda'

const create = (values, uid, {auths, models}) =>
  auths.userCanUpdateProject({uid, projectKey: values.projectKey})
  .then(({profile}) =>
    models.Opps.push({
      ...values,
      ownerProfileKey: profile.$key,
    }).key()
  )

const remove = (key, uid, {auths, models}) =>
  auths.userCanUpdateOpp({uid, oppKey: key})
  .then(() => models.Opps.child(key).remove())
  .then(always(key))

function getAcceptedApplicants(Engagements, oppKey) {
  return Engagements.by('oppKey', oppKey)
    .then(engagements => engagements.filter(e => e.isAccepted))
}

function checkAndSendAcceptanceEmail(key, {confirmationsOn}, uid, opp, {Engagements, Profiles, Opps, Projects}) { // eslint-disable-line
  // confirmations are being turned on
  if (confirmationsOn && !opp.hasOwnProperty(confirmationsOn)) {
    process.nextTick(() => {
      getAcceptedApplicants(Engagements, key)
        .then(engagements => {
          engagements.forEach(a => {
            getEmailInfo({key, profileKey: a.profileKey, uid, oppKey: key, Profiles, Opps, Projects}) // eslint-disable-line max-len
            .then(info => sendEngagmentEmail(info, {
              templateId: 'dec62dab-bf8e-4000-975a-0ef6b264dafe',
              subject: 'Application accepted for',
            }))
          })
        })
    })
  }
  return true
}

const update = ({key, values}, uid, {auths, models}) =>
  auths.userCanUpdateOpp({uid, oppKey: key})
  .then(({opp}) =>
    models.Opps.child(key).update(values)
      .then(() => checkAndSendAcceptanceEmail(key, values, uid, opp, models))
      .then(always(key)))

export default {
  create,
  remove,
  update,
}
