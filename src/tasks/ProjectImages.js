import {isAdmin, isUser} from './authorization'

const canChange = (profile, project) =>
  isAdmin(profile) || isUser(profile, project.ownerProfileKey)

const set = ({key, values}, uid, {Profiles, Projects, ProjectImages}) =>
  Promise.all([
    Profiles.first('uid', uid),
    Projects.get(key),
  ])
  .then(([profile,project]) => {
    if (!canChange(profile, project)) {
      throw new Error('Unauthorized')
    }
  })
  .then(() => ProjectImages.child(key).set(values))
  .then(() => key)

export default {
  set,
}
