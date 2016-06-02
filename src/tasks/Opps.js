/* eslint max-nested-callbacks: 0 */
import {isAdmin, isUser} from './authorization'
import {getEmailInfo, sendEngagmentEmail} from './emails'

const create = (values, uid, {Profiles, Opps, Projects}) =>
  Promise.all([
    Profiles.first('uid', uid),
    Projects.get(values.projectKey),
  ])
  .then(([user, project]) =>
    (isAdmin(user) || isUser(user, project.ownerProfileKey)) &&
    Opps.push({...values,
      ownerProfileKey: user.$key,
    }).key()
  )

const remove = (key, uid, {Profiles, Opps, Projects}) =>
  Promise.all([
    Profiles.first('uid', uid),
    Opps.get(key),
  ])
  .then(([user, opp]) =>
    Projects.get(opp.projectKey).then(project => [user, opp, project])
  )
  .then(([user, opp, project]) =>
    (isUser(user,opp.ownerProfileKey) ||
         isUser(user,project.ownerProfileKey) ||
         isAdmin(user)) &&
      Opps.child(key).remove() && key
  )

function getAcceptedApplicants(Engagements, oppKey) {
  return Engagements.by('oppKey', oppKey)
    .then(engagements => engagements.filter(e => e.isAccepted))
}

function checkAndSendAcceptanceEmail(key, {confirmationsOn}, uid, opp, Engagements, Profiles, Opps, Projects) { // eslint-disable-line
  console.log(opp)
  if (confirmationsOn && !opp.hasOwnProperty(confirmationsOn)) {
    process.nextTick(() => {
      getAcceptedApplicants(Engagements, opp.key)
        .then(engagements => {
          engagements.forEeach(a => {
            getEmailInfo({key, profileKey: a.profileKey, uid, oppKey: key, Profiles, Opps, Projects}) // eslint-disable-line max-len
            .then(info => sendEngagmentEmail(info, {
              templateId: '96e36ab7-43b0-4d45-8309-32c52530bd8a',
              subject: 'New Engagement for',
            }))
          })
        })
    })
  }
  return false
}

const update = ({key, values}, uid, {Profiles, Opps, Projects, Engagements}) =>
  Promise.all([
    Profiles.first('uid', uid),
    Opps.get(key),
  ])
  .then(([user, opp]) =>
    Projects.get(opp.projectKey).then(project => [user, opp, project])
  )
  .then(([user, opp, project]) =>
    checkAndSendAcceptanceEmail(key, values, uid, opp, Engagements, Profiles, Opps, Projects) || // eslint-disable-line max-len
    isUser(user,opp.ownerProfileKey) ||
         isUser(user,project.ownerProfileKey) ||
         isAdmin(user) &&
      Opps.child(key).update(values) && key
  )

export default {
  create,
  remove,
  update,
}
