import {isAdmin, isEAP, isUser} from './authorization'

const create = (values, uid, {Profiles, Projects}) =>
  Profiles.first('uid', uid)
  .then(user => {
    console.log('found user', user, isAdmin(user), isEAP(user))
    return (isAdmin(user) || isEAP(user)) &&
      Projects.push({...values,
        ownerProfileKey: user.$key,
      }).key
  })

const remove = (key, uid, {Profiles, Projects}) =>
  Promise.all([
    Profiles.first('uid', uid),
    Projects.get(key),
  ])
  .then(([profile,project]) =>
    isUser(profile, project.ownerProfileKey) &&
      Projects.child(key).remove() && key
  )

const update = ({key, values}, uid, {Profiles, Projects}) =>
  Promise.all([
    Profiles.first('uid', uid),
    Projects.get(key),
  ])
  .then(([profile,project]) =>
    isUser(profile, project.ownerProfileKey) &&
      Projects.child(key).update(values) && key
  )

export default {
  create,
  remove,
  update,
}
