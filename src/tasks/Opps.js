import {isAdmin, isUser} from './authorization'

const create = (values, uid, {Profiles, Opps, Projects}) =>
  Promise.all([
    Profiles.first('uid', uid),
    Projects.get(values.projectKey),
  ])
  .then(([user, project]) =>
    (isAdmin(user) || isUser(user, project.ownerProfileKey)) &&
    Opps.push({...values,
      ownerProfileKey: user.$key,
    }).key()
  )

const remove = (key, uid, {Profiles, Opps, Projects}) =>
  Promise.all([
    Profiles.first('uid', uid),
    Opps.get(key),
  ])
  .then(([user, opp]) =>
    Projects.get(opp.projectKey).then(project => [user, opp, project])
  )
  .then(([user, opp, project]) =>
    isUser(user,opp.ownerProfileKey) ||
    isUser(user,project.ownerProfileKey) ||
    isAdmin(user) &&
      Opps.child(key).remove() && key
  )

const update = ({key, values}, uid, {Profiles, Opps, Projects}) =>
  Promise.all([
    Profiles.first('uid', uid),
    Opps.get(key),
  ])
  .then(([user, opp]) =>
    Projects.get(opp.projectKey).then(project => [user, opp, project])
  )
  .then(([user, opp, project]) =>
    isUser(user,opp.ownerProfileKey) ||
    isUser(user,project.ownerProfileKey) ||
    isAdmin(user) &&
      Opps.child(key).update(values) && key
  )

export default {
  create,
  remove,
  update,
}
