import {isAdmin, isUser} from './authorization'

const set = ({key, values}, uid, {Profiles, Projects, ProjectImages}) =>
  Promise.all([
    Profiles.first('uid', uid),
    Projects.get(key),
  ])
  .then(([profile,project]) =>
    isAdmin(profile) || isUser(profile, project.ownerProfileKey) &&
      ProjectImages.child(key).set(values) && key
  )

export default {
  set,
}
