import {isAdmin, isUser} from './authorization'

const getTeamAndProject = (teamKey, {Teams, Projects}) =>
  Teams.get(teamKey).then(team =>
    Projects.get(team.projectKey).then(project => [team, project])
  )

const create = (values, uid, {Profiles, Teams, Projects, Shifts}) =>
  Profiles.by('uid', uid)
  .then(user =>
    getTeamAndProject(values.teamKey, {Teams, Projects}).then(r => [user, ...r])
  )
  .then(([user, team, project]) =>
    isAdmin(user) ||
    isUser(user, team.ownerProfileKey) ||
    isUser(user, project.ownerProfileKey) &&
    Shifts.push({...values,
      ownerProfileKey: user.$key,
    }).key()
  )

const remove = (key, uid, {Profiles, Teams, Projects, Shifts}) =>
  Promise.all([
    Profiles.by('uid', uid),
    Shifts.get(key),
  ])
  .then(([user, shift]) =>
    getTeamAndProject(shift.teamKey, {Teams, Projects}).then(r => [user, ...r])
  )
  .then(([user, team, project]) =>
    isUser(user,team.ownerProfileKey) ||
    isUser(user,project.ownerProfileKey) ||
    isAdmin(user) &&
      Shifts.child(key).remove() && key
  )

const update = ({key, values}, uid, {Profiles, Teams, Projects, Shifts}) =>
  Promise.all([
    Profiles.by('uid', uid),
    Shifts.get(key),
  ])
  .then(([user, shift]) =>
    [user, ...getTeamAndProject(shift.teamKey, {Teams, Projects})]
  )
  .then(([user, team, project]) =>
    isUser(user,team.ownerProfileKey) ||
    isUser(user,project.ownerProfileKey) ||
    isAdmin(user) &&
      Shifts.child(key).update(values) && key
  )

export default {
  create,
  remove,
  update,
}
