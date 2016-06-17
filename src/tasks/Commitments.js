const create = (values, uid, {models: {Commitments}}) =>
  Commitments.push(values).then(ref => ref.key())

const remove = (key, uid, {getStuff, models: {Commitments}}) =>
  getStuff({
    profile: {uid},
    commitment: key,
  })
  .then(() => Commitments.child(key).remove())
  .then(() => key)

const update = ({key, values}, uid, {models: {Commitments}}) =>
  Commitments.child(key).update(values).then(() => key)

export default {
  create,
  remove,
  update,
}
