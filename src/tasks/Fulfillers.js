const create = (values, uid, {models: {Fulfillers}}) =>
    Fulfillers.push(values).then(ref => ref.key())

const remove = (key, uid, {getStuff, models: {Fulfillers}}) =>
  getStuff({
    profile: {uid},
    fulfiller: key,
  })
  .then(() =>
    Fulfillers.child(key).remove() && key
  )

const update = ({key, values}, uid, {models: {Fulfillers}}) =>
  Fulfillers.child(key).update(values).then(() => key)

export default {
  create,
  remove,
  update,
}
