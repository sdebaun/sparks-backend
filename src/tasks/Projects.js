function actions() {
  this.add('role:Projects,cmd:create', async function({profile, values}) {
    return await this.act('role:Firebase,model:Projects,cmd:push', {values: {
      ...values,
      ownerProfileKey: profile.$key,
    }})
  })

  this.add({role:'Projects',cmd:'remove'}, async function({key}) {
    return await this.act('role:Firebase,model:Projects,cmd:remove', {key})
  })

  this.add({role:'Projects',cmd:'update'}, async function({key, values}) {
    return await this.act('role:Firebase,model:Projects,cmd:update', {key, values})
  })
}

export default actions
