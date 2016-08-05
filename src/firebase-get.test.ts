import tape from 'test/tape-seneca'
import {type} from 'ramda'

const test = tape('FirebaseGet', [])

test('model specified', async function(t) {
  const vol = await this.act('role:Firebase,cmd:get,model:Profiles,key:volunteer')
  t.ok(vol)
  t.equal(vol.uid, 'volunteer')
})

test('single lookup by key', async function(t) {
  const {project} = await this.act('role:Firebase,cmd:get', {project: 'testFest'})
  t.ok(project, 'returns project')
  t.equal(project.name, 'Test Fest', 'the correct one')
})

test('single lookup by value', async function(t) {
  const {profile} = await this.act('role:Firebase,cmd:get', {profile: {uid: 'teamLead'}})
  t.ok(profile, 'returns profile')
  t.equal(profile.fullName, 'Mr Leader', 'the correct one')
})

test('array lookup by value', async function(t) {
  const {shifts} = await this.act('role:Firebase,cmd:get', {shifts: {teamKey: 'testTeam'}})
  t.ok(shifts, 'returns shifts')
  t.equal(type(shifts), 'Array', 'an array of shifts')
  t.equal(shifts.length, 2, 'with two entries')
})

test('lookup multiple single values', async function(t) {
  const {project, profile} = await this.act('role:Firebase,cmd:get', {project: 'testFest', profile: {uid: 'teamLead'}})
  t.ok(project, 'returns project')
  t.equal(project.name, 'Test Fest', 'the correct one')
  t.ok(profile, 'returns profile')
  t.equal(profile.fullName, 'Mr Leader', 'the correct one')
})

test('nested lookup by value', async function(t) {
  const {team, shifts} = await this.act('role:Firebase,cmd:get', {team: 'testTeam', shifts: {teamKey: ['team', '$key']}})
  t.ok(team)
  t.equal(team.name, 'Test Team')
  t.ok(shifts)
  t.equal(type(shifts), 'Array', 'an array of shifts')
  t.equal(shifts.length, 2, 'with two entries')
})

test('nested lookup by key', async function(t) {
  const {user, profile} = await this.act('role:Firebase,cmd:get', {
    profile: {uid: 'admin'},
    user: ['profile', 'uid'],
  })
  t.ok(user)
  t.ok(profile)
})

test('nested lookup, multiple dependents', async function(t) {
  const {team, project, organizers} = await this.act('role:Firebase,cmd:get', {
    team: 'testTeam',
    project: ['team', 'projectKey'],
    organizers: {projectKey: ['team', 'projectKey']},
  })

  t.ok(team, 'found team')
  t.ok(project, 'found project')
  t.ok(organizers, 'found organizers')
  t.equal(organizers[0].$key, 'organizer')
})

test('nested not found', async function(t) {
  const {team, project} = await this.act('role:Firebase,cmd:get', {
    team: 'noTeam',
    project: ['team', 'projectKey'],
  })

  t.notOk(team)
  t.notOk(project)
})
