import {not, unless, merge} from 'ramda'
import defaults from './defaults'

function Organizers() {
  const seneca = this

  this.add({role:'Organizers',cmd:'sendEmail'}, ({key, uid}, respond) =>
    seneca.act({role:'Firebase',cmd:'get', organizer: key})
    .then(({organizer}) =>
      seneca.act({role:'Firebase',cmd:'get',project: organizer.projectKey})
      .then(merge({organizer}))
    )
    .then(({project, organizer}) =>
      seneca.act({
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

  this.add({role:'Organizers',cmd:'create'}, async function({values, profile, uid}) {
    const {key} = await this.act('role:Firebase,model:Organizers,cmd:push', {values: merge(
      values,
      {invitedByProfileKey: profile.$key}
    )})

    this.act({role:'Organizers',cmd:'sendEmail',uid,key})

    return {key}
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
    seneca.act({role:'Firebase',cmd:'get',
      profile: {uid},
      organizer: key,
    })
    .then(rejectCannotAccept)
    .then(({profile}) =>
      seneca.act('role:Firebase,model:Organizers,cmd:update', {key, values: {
        isAccepted: true,
        profileKey: profile.$key,
        acceptedAt: Date.now(),
      }})
    .then(() => respond(null, {key}))
    .catch(err => respond(err))))
}

export default defaults(Organizers, 'remove')
