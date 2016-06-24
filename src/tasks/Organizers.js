import Promise from 'bluebird'
import {not, unless, equals, merge} from 'ramda'

function actions({models: {Organizers}}) {
  const act = Promise.promisify(this.act, {context: this})

  this.add({role:'Organizers',cmd:'sendEmail'}, ({key, uid}, respond) =>
    act({role:'Firebase',cmd:'get', organizer: key})
    .then(({organizer}) =>
      act({role:'Firebase',cmd:'get',project: organizer.projectKey})
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

  this.add({role:'Organizers',cmd:'create'},
    ({values, profile, uid}, respond) => {
      const key = Organizers.push({
        ...values,
        invitedByProfileKey: profile.$key,
      }).key()

      this.act({role:'Organizers',cmd:'sendEmail',uid,key}, (...args) =>
        console.log('Sent email', args)
      )

      respond(null, {key})
    })

  this.add({role:'Organizers',cmd:'remove'},
    ({key, projectKey, uid}, respond) => {
      Organizers.child(key).remove()
        .then(() => respond(null, {key}))
        .catch(err => respond(err))
    })

  const canAccept = ({profile, organizer}) =>
    profile &&
    organizer &&
    not(organizer.isAccepted) &&
    not(organizer.profileKey)

  const rejectCannotAccept = unless(canAccept, ({profile, organizer}) =>
    Promise.reject(
      `User ${profile.$key} cannot accept organizer invite ${organizer.$key}`))

  this.add({role:'Organizers',cmd:'accept'}, ({uid, key}, respond) =>
    act({role:'Firebase',cmd:'get',
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
