import defaults from './defaults'

function Projects() {
  this.add('role:Projects,cmd:create', async function({profile, values}) {
    return await this.act('role:Firebase,model:Projects,cmd:push', {values: {
      ...values,
      ownerProfileKey: profile.$key,
    }})
  })
}

export default defaults(Projects, 'remove', 'update')
