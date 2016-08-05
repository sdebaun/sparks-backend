import tape from '../test/tape-seneca'
import Arrivals from './Arrivals'

const test = tape('Arrivals', [Arrivals])

test('create', async function(t) {
  const {profile} = await this.act('role:Firebase,cmd:get', {profile: 'admin'})
  const {key} = await this.act('role:Arrivals,cmd:create', {
    profile,
    profileKey: 'volTwo',
    projectKey: 'testFest',
  })

  t.ok(key)
  const {arrival} = await this.act('role:Firebase,cmd:get', {arrival: key})
  t.ok(arrival)
  t.equal(arrival.projectKey, 'testFest')
  t.equal(arrival.profileKey, 'volTwo')
  t.equal(arrival.projectKeyProfileKey, 'testFest-volTwo')
  t.equal(arrival.ownerProfileKey, 'admin')
  t.ok(arrival.arrivedAt)
})

test('create twice causes error', async function(t) {
  const {profile} = await this.act('role:Firebase,cmd:get', {profile: 'admin'})
  const {key, error} = await this.act('role:Arrivals,cmd:create', {
    profile,
    profileKey: 'volunteer',
    projectKey: 'testFest',
  })

  t.notOk(key)
  t.equal(error, 'Already arrived')
})
