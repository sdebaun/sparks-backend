import Promise from 'bluebird'
import {not, unless, equals, merge} from 'ramda'

function actions({auths: {userCanUpdateProject}, models: {Organizers}, getStuff}) {
  const act = Promise.promisify(this.act, {context: this})

  this.add({role:'Organizers',cmd:'sendEmail'}, ({key, uid}, respond) =>
    getStuff({organizer: key})
    .then(({organizer}) =>
      userCanUpdateProject({uid, projectKey: organizer.projectKey})
      .then(merge({organizer}))
    )
    .then(({project, organizer}) =>
      act({
        role:'email',
        cmd:'send',
        email:'organizer',
        values: organizer,
        project,
        key,
        subject: 'Invited to be an organizer for',
        templateId: 'a005f2a2-74b0-42f4-8ac6-46a4b137b7f1',
      }))
    .then(() => respond(null, {key}))
    .catch(err => respond(err)))

  this.add({role:'Organizers',cmd:'create'}, ({values, uid}, respond) =>
    userCanUpdateProject({uid, projectKey: values.projectKey})
    .then(({profile}) =>
      Organizers.push({
        ...values,
        invitedByProfileKey: profile.$key,
      }).key())
    .then(key => {
      process.nextTick(() =>
        this.act({role:'Organizers',cmd:'sendEmail',uid,key}, console.log))

      respond(null, {key})
    })
    .catch(err => respond(err)))

  this.add({role:'Organizers',cmd:'remove'},
          ({key, projectKey, uid}, respond) =>
    userCanUpdateProject({uid, projectKey})
    .then(() => Organizers.child(key).remove())
    .then(() => respond(null, {key}))
    .catch(err => respond(err)))

  const canAccept = ({profile, organizer}) =>
    profile &&
    organizer &&
    not(organizer.isAccepted) &&
    not(organizer.profileKey)

  const rejectCannotAccept = unless(canAccept, ({profile, organizer}) =>
    Promise.reject(
      `User ${profile.$key} cannot accept organizer invite ${organizer.$key}`))

  this.add({role:'Organizers',cmd:'accept'}, ({uid, key}, respond) =>
    getStuff({
      profile: {uid},
      organizer: key,
    })
    .then(rejectCannotAccept)
    .then(({profile, organizer}) =>
      Organizers.child(organizer.$key)
        .update({
          isAccepted: true,
          profileKey: profile.$key,
          acceptedAt: Date.now()}))
    .then(() => respond(null, {key}))
    .catch(err => respond(err)))
}

export default actions
