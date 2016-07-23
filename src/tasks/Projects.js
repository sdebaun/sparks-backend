import defaults from './defaults'

function actions() {
  this.add('role:Projects,cmd:create', async function({profile, values}) {
    return await this.act('role:Firebase,model:Projects,cmd:push', {values: {
      ...values,
      ownerProfileKey: profile.$key,
    }})
  })

  return defaults(this, 'Projects')
    .init('remove', 'update')
}

export default actions
