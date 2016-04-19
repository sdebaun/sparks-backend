import {isAdmin, isUser} from './authorization'

const create = (values, uid, {Profiles}) =>
  Profiles.first('uid', uid)
  .then(profile =>
    !profile ?
    Profiles.push({...values,
      uid,
      isAdmin: false,
      isEAP: false,
    }).key() :
    profile.$key
  )

const update = ({key, values}, uid, {Profiles}) =>
  Profiles.first('uid', uid)
  .then(profile =>
    isAdmin(profile) && Profiles.child(key).update(values) && key ||
    isUser(profile,key) && Profiles.child(key).update({...values,
      isAdmin: profile.isAdmin,
      isEAP: profile.isAdmin,
    }) && key
  )

export default {
  create,
  update,
}
