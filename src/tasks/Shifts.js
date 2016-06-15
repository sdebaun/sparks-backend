import {userCanUpdateTeam} from './authorization'
import {getStuff} from '../util'
import {always} from 'ramda'
import {updateCounts} from './Assignments'

const create = (values, uid, models) =>
  userCanUpdateTeam({uid, teamKey: values.teamKey}, models)
  .then(({profile}) =>
    models.Shifts.push({
      ...values,
      ownerProfileKey: profile.$key,
    }).key())

const remove = (key, uid, models) =>
  getStuff(models)({
    shift: key,
  })
  .then(({shift}) => userCanUpdateTeam({uid, teamKey: shift.teamKey}, models))
  .then(() => models.Shifts.child(key).remove())
  .then(always(key))

const update = ({key, values}, uid, models) =>
  getStuff(models)({
    shift: key,
  })
  .then(({shift}) => userCanUpdateTeam({uid, teamKey: shift.teamKey}, models))
  .then(() => models.Shifts.update(values))
  .then(() => updateCounts(key, models))
  .then(always(key))

export default {
  create,
  remove,
  update,
}
