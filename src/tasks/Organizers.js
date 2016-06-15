import {userCanUpdateProject} from './authorization'
import {getStuff} from '../util'
import {sendOrganizerEmail} from './emails'
import {not, unless, equals} from 'ramda'

const sendEmail = ({key}, uid, models) =>
  getStuff(models)({organizer: key})
  .then(({organizer}) =>
    userCanUpdateProject({uid, projectKey: organizer.projectKey}, models)
    .then(({project}) => ({project, organizer}))
  )
  .then(({project, organizer}) =>
    sendOrganizerEmail({
      values: organizer,
      project,
      key,
    }, {
      subject: 'Invited to be an organizer for',
      templateId: 'a005f2a2-74b0-42f4-8ac6-46a4b137b7f1',
    }))
  .then(() => key)

const create = (values, uid, models) =>
  userCanUpdateProject({uid, projectKey: values.projectKey}, models)
  .then(({profile}) => {
    const key = models.Organizers.push({
      ...values,
      invitedByProfileKey: profile.$key,
    }).key()

    process.nextTick(() => sendEmail({key}, uid, models))
    return key
  })

const remove = ({key, projectKey}, uid, models) =>
  userCanUpdateProject({uid, projectKey}, models)
  .then(() =>
    models.Organizers.child(key).remove() && key)

const canAccept = ({profile, organizer}) =>
  profile &&
  organizer &&
  not(organizer.isAccepted) &&
  not(organizer.profileKey) &&
  equals(organizer.inviteEmail, profile.email)

const rejectCannotAccept = unless(canAccept, ({profile, organizer}) =>
  Promise.reject(
    `User ${profile.$key} cannot accept organizer invite ${organizer.$key}`))

const accept = ({key}, uid, models) =>
  getStuff(models)({
    profile: {uid},
    organizer: key,
  })
  .then(rejectCannotAccept)
  .then(({profile, organizer}) =>
    models.Organizers.child(organizer.$key)
      .update({
        isAccepted: true,
        profileKey: profile.$key,
        acceptedAt: Date.now()}))
  .then(() => key)

export default {
  accept,
  create,
  sendEmail,
  remove,
}
