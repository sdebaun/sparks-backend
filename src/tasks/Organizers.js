import {isUser, isAdmin} from './authorization'
import {sendOrganizerEmail} from './emails'

const create = (values, uid, {Organizers, Projects, Profiles}) =>
  Promise.all([
    Profiles.first('uid', uid),
    Projects.get(values.projectKey),
  ])
    .then(([user, project]) => {
      if (isUser(user, project.ownerProfileKey) || isAdmin(user)) {
        const key = Organizers.push(values).key()
        process.nextTick(() => {
          sendOrganizerEmail({values, project, key}, {
            subject: 'Invited to be an organizer for',
            templateId: 'a005f2a2-74b0-42f4-8ac6-46a4b137b7f1',
          })
        })
        return key
      }
    })

const remove = ({key, projectKey}, uid, {Organizers, Profiles, Projects}) =>
  Promise.all([
    Profiles.first('uid', uid),
    Projects.get(projectKey),
  ])
  .then(([user, project]) => {
    if (isUser(user, project.ownerProfileKey) || isAdmin(user)) {
      Organizers.child(key).remove()
      return key
    }
  })

export default {
  create,
  remove,
}
