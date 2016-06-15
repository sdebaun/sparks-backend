const create = (values, uid, {Memberships}) =>
  Memberships.push({...values,
    isApplied: true,
    isAccepted: false,
    isConfirmed: false,
  }).then(ref => ref.key())

const remove = (key, uid, {Profiles, Memberships}) =>
  Promise.all([
    Profiles.first('uid', uid),
    Memberships.get(key),
  ])
  .then(() =>
    Memberships.child(key).remove() && key
  )

const update = ({key, values}, uid, {Memberships}) =>
  Memberships.child(key).update(values).then(() => key)

export default {
  create,
  remove,
  update,
}
