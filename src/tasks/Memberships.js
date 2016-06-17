const create = (values, uid, {models: {Memberships}}) =>
  Memberships.push({...values,
    isApplied: true,
    isAccepted: false,
    isConfirmed: false,
  }).then(ref => ref.key())

const remove = (key, uid, {getStuff, models: {Memberships}}) =>
  getStuff({
    profile: {uid},
    membership: key,
  })
  .then(() =>
    Memberships.child(key).remove() && key
  )

const update = ({key, values}, uid, {models: {Memberships}}) =>
  Memberships.child(key).update(values).then(() => key)

export default {
  create,
  remove,
  update,
}
