import {omit} from 'ramda'

function action() {
  const seneca = this

  async function makeUserAndProfile(uid, values) {
    const {key} = await seneca.act('role:Firebase,cmd:push,model:Profiles', {values: {
      ...values,
      uid,
      isAdmin: false,
      isEAP: false,
    }})

    await seneca.act('role:Firebase,model:Users,cmd:set', {uid, profileKey: key})
    return {key}
  }

  this.add({role:'Profiles',cmd:'create'}, async function({uid, values}) {
    const {profile} = await this.act('role:Firebase,cmd:get', {profile: {uid}})
    let key

    if (profile) {
      key = profile.$key
    } else {
      key = await makeUserAndProfile(uid, values)
    }

    await seneca.act('role:Firebase,model:Users,cmd:set', {uid, profileKey: key})
    return {key}
  })

  this.add({role:'Profiles',cmd:'update',isAdmin:true}, async function({key, values}) {
    return await this.act('role:Firebase,cmd:update,model:Profiles', {key, values})
  })

  this.add({role:'Profiles',cmd:'update',isAdmin:false}, async function({key, values}) {
    return await this.act('role:Firebase,cmd:update,model:Profiles', {
      key,
      values: omit(['isAdmin', 'isEAP'], values),
    })
  })
}

export default action
