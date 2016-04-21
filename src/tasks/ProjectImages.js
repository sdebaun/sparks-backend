import {isAdmin, isEAP, isUser} from './authorization'

const set = ({key, values}, uid, {Profiles, Projects, ProjectImages}) =>
  Promise.all([
    Profiles.first('uid', uid),
    Projects.get(key),
  ])
  .then(([profile,project]) =>
    isUser(profile, project.ownerProfileKey) &&
      ProjectImages.child(key).set(values) && key
  )

export default {
  set,
}
