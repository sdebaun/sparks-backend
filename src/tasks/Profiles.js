import {omit} from 'ramda'

function action({models: {Profiles, Users}}) {
  const add = this.add

  const makeUserAndProfile = (uid, values) => {
    const profileKey = Profiles.push({...values,
      uid,
      isAdmin: false,
      isEAP: false,
    }).key()

    return Users.set(uid, profileKey).then(() => profileKey)
  }

  add({role:'Profiles',cmd:'create'}, async function({uid, values}) {
    const profile = await Profiles.first('uid', uid)

    if (profile) {
      return {key: profile.$key}
    } else {
      return await makeUserAndProfile(uid, values)
    }
  })

  add({role:'Profiles',cmd:'update',isAdmin:true}, async function({key, values}) {
    await Profiles.child(key).update(values)
    return {key}
  })

  add({role:'Profiles',cmd:'update',isAdmin:false}, async function({key, values, uid}) {
    await Profiles.child(key).update(omit(['isAdmin', 'isEAP'], values))
    return {key}
  })
}

export default action
