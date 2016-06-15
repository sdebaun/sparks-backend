import {userCanUpdateProject} from './authorization'
import {getStuff} from '../util'

const set = ({key, values}, uid, models) =>
  getStuff(models)({
    team: key,
  })
  .then(({team}) =>
    userCanUpdateProject({uid, projectKey: team.projectKey}, models))
  .then(() =>
    models.TeamImages.child(key).set(values) && key)

export default {
  set,
}
