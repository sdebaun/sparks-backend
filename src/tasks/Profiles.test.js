import tape from 'test/tape-seneca'
import Profiles from './Profiles'

const test = tape([Profiles])
const uid = '1234567abc'

const values = {
  fullName: 'Bob Fossil',
  email: 'bob.fossil@thezooniverse.com.eu',
  phone: '441234884411',
}

test('Profiles create / new profile', async function(t) {
  const {key} = await this.act('role:Profiles,cmd:create', {uid, values})
  t.ok(key)

  const {profile} = await this.act('role:Firebase,cmd:get', {profile: key})
  t.equal(profile.fullName, 'Bob Fossil', 'sets name')
  t.equal(profile.uid, uid, 'sets uid')
  t.false(profile.isAdmin, 'new profiles are not admin')
  t.false(profile.isEAP, 'new profiles are not eap')

  const {user} = await this.act('role:Firebase,model:Users,cmd:get', {key: uid})
  t.ok(user, 'adds user record')
})

test('Profiles create / existing profile', async function(t) {
  const {key: originalProfile} = await this.act('role:Profiles,cmd:create', {uid, values})
  t.ok(originalProfile, 'returns profile key')

  const {key: newProfile} = await this.act('role:Profiles,cmd:create', {uid, values: {fullName: 'Vince Noir'}})
  t.ok(newProfile, 'returns profile key again')

  t.equal(newProfile, originalProfile, 'it does not create a new profile')

  const {profile} = await this.act('role:Firebase,cmd:get', {profile: newProfile})
  t.equal(profile.fullName, 'Bob Fossil', 'does not reset the name the second time around')
})

test('Profiles update / not admin', async function(t) {
  await this.act('role:Profiles,cmd:update,isAdmin:false', {key: 'volunteer', values: {
    fullName: 'Spiny Norman',
    isAdmin: true,
    isEAP: true,
  }})

  const {profile} = await this.act('role:Firebase,cmd:get', {profile: 'volunteer'})
  t.equal(profile.fullName, 'Spiny Norman')
  t.false(profile.isAdmin)
  t.false(profile.isEAP)
})

test('Profiles update / admin', async function(t) {
  await this.act('role:Profiles,cmd:update,isAdmin:true', {key: 'volunteer', values: {
    fullName: 'Dinsdale',
    isAdmin: true,
    isEAP: true,
  }})

  const {profile} = await this.act('role:Firebase,cmd:get', {profile: 'volunteer'})
  t.equal(profile.fullName, 'Dinsdale')
  t.true(profile.isAdmin)
  t.true(profile.isEAP)
})
