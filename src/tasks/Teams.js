import {isAdmin, isUser} from './authorization'

const create = (values, uid, {Profiles, Teams, Projects}) =>
  Promise.all([
    Profiles.first('uid', uid),
    Projects.get(values.projectKey),
  ])
  .then(([user, project]) =>
    (isAdmin(user) || isUser(user, project.ownerProfileKey)) &&
    Teams.push({...values,
      ownerProfileKey: user.$key,
    }).key()
  )
  // .then(([user, project]) => {
  //   console.log('New Team', user, isAdmin(user), isUser(user, project.ownerProfileKey))
  //   return (isAdmin(user) || isUser(user, project.ownerProfileKey)) &&
  //   Teams.push({...values,
  //     ownerProfileKey: user.$key,
  //   }).key()
  // })

const remove = (key, uid, {Profiles, Teams, Projects}) =>
  Promise.all([
    Profiles.first('uid', uid),
    Teams.get(key),
  ])
  .then(([user, team]) =>
    Projects.get(team.projectKey).then(project => [user, team, project])
  )
  .then(([user, team, project]) =>
    (isUser(user,team.ownerProfileKey) ||
         isUser(user,project.ownerProfileKey) ||
         isAdmin(user)) &&
      Teams.child(key).remove() && key
  )

const update = ({key, values}, uid, {Profiles, Teams, Projects}) =>
  Promise.all([
    Profiles.first('uid', uid),
    Teams.get(key),
  ])
  .then(([user, team]) =>
    Projects.get(team.projectKey).then(project => [user, team, project])
  )
  .then(([user, team, project]) =>
    (isUser(user,team.ownerProfileKey) ||
         isUser(user,project.ownerProfileKey) ||
         isAdmin(user)) &&
      Teams.child(key).update(values) && key
  )

export default {
  create,
  remove,
  update,
}
