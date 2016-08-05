// Arrivals
export default function() {
  this.add('role:Auth,model:Arrivals,cmd:create', async function({uid, projectKey}) {
    return await this.act('role:Auth,model:Projects,cmd:update', {uid, key: projectKey})
  })

  this.add('role:Auth,model:Arrivals', async function({uid, key}) {
    const {arrival} = await this.act('role:Firebase,cmd:get', {arrival:key})
    const projectKey = arrival.projectKey
    return await this.act('role:Auth,model:Projects,cmd:update', {uid, key: projectKey})
  })

  return 'AuthArrivals'
}
