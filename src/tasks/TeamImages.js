import {isAdmin, isEAP, isUser} from './authorization'

const set = ({key, values}, uid, {Profiles, Projects, TeamImages}) =>
  Promise.all([
    Profiles.first('uid', uid),
  ])
  .then(([profile]) =>
    TeamImages.child(key).set(values) && key
  )

export default {
  set,
}
