import {isAdmin, isUser} from './authorization'

const create = (values, uid, {Profiles, Fulfillers, Projects}) =>
    Fulfillers.push(values).then(ref => ref.key())

const remove = (key, uid, {Profiles, Fulfillers, Projects}) =>
  Promise.all([
    Profiles.first('uid', uid),
    Fulfillers.get(key),
  ])
  .then(([user, fulfiller]) =>
    Fulfillers.child(key).remove() && key
  )

const update = ({key, values}, uid, {Fulfillers}) =>
  Fulfillers.child(key).update(values).then(ref => key)

export default {
  create,
  remove,
  update,
}
