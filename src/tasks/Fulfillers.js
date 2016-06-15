const create = (values, uid, {Fulfillers}) =>
    Fulfillers.push(values).then(ref => ref.key())

const remove = (key, uid, {Profiles, Fulfillers}) =>
  Promise.all([
    Profiles.first('uid', uid),
    Fulfillers.get(key),
  ])
  .then(() =>
    Fulfillers.child(key).remove() && key
  )

const update = ({key, values}, uid, {Fulfillers}) =>
  Fulfillers.child(key).update(values).then(() => key)

export default {
  create,
  remove,
  update,
}
