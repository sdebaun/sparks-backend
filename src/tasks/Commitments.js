const create = (values, uid, {Commitments}) =>
  Commitments.push(values).then(ref => ref.key())

const remove = (key, uid, {Profiles, Commitments}) =>
  Promise.all([
    Profiles.first('uid', uid),
    Commitments.get(key),
  ])
  .then(([user, fulfiller]) =>
    Commitments.child(key).remove() && key
  )

const update = ({key, values}, uid, {Commitments}) =>
  Commitments.child(key).update(values).then(() => key)

export default {
  create,
  remove,
  update,
}
