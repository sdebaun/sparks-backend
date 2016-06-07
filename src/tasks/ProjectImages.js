import {isAdmin, isUser} from './authorization'

const canChange = (profile, project) =>
  isAdmin(profile) || isUser(profile, project.ownerProfileKey)

const profileAndProject = (key, uid, {Profiles, Projects}) =>
  Promise.all([
    Profiles.first('uid', uid),
    Projects.get(key),
  ])
  .then(([profile,project]) => {
    if (!canChange(profile, project)) {
      throw new Error('Unauthorized')
    }
  })

const set = ({key, values}, uid, {Profiles, Projects, ProjectImages}) =>
  profileAndProject(key, uid, {Profiles, Projects})
  .then(() => ProjectImages.child(key).set(values))
  .then(() => key)

const remove = (key, uid, {Profiles, Projects, ProjectImages}) =>
  profileAndProject(key, uid, {Profiles, Projects})
  .then(() => ProjectImages.child(key).remove())

export default {
  set,
  remove,
}
