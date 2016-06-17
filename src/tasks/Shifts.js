import {always} from 'ramda'
import {updateCounts} from './Assignments'

const create = (values, uid, {models, auths}) =>
  auths.userCanUpdateTeam({uid, teamKey: values.teamKey})
  .then(({profile}) =>
    models.Shifts.push({
      ...values,
      ownerProfileKey: profile.$key,
    }).key())

const remove = (key, uid, {models, auths, getStuff}) =>
  getStuff({
    shift: key,
  })
  .then(({shift}) =>
    auths.userCanUpdateTeam({uid, teamKey: shift.teamKey}))
  .then(() => models.Shifts.child(key).remove())
  .then(always(key))

const update = ({key, values}, uid, {models, auths, getStuff}) =>
  getStuff({
    shift: key,
  })
  .then(({shift}) =>
    auths.userCanUpdateTeam({uid, teamKey: shift.teamKey}))
  .then(() => models.Shifts.update(values))
  .then(() => updateCounts(key, models))
  .then(always(key))

export default {
  create,
  remove,
  update,
}
