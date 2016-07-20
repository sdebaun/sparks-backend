import tape from 'test/tape-seneca'
import Assignments from './Assignments'

function mockShifts() {
  this.add('role:Shifts,cmd:updateCounts', async function(msg) {
    return {}
  })

  this.add('role:Engagements,cmd:updateAssignmentCount', async function(msg) {
    return {}
  })
}

const test = tape([mockShifts, Assignments])

test('Assignments create', async function(t) {
  const values = {
    oppKey: 'testOpp',
    engagementKey: 'testEngagement',
    teamKey: 'testTeam',
    shiftKey: 'testShift',
  }
  const response = await this.act('role:Assignments,cmd:create', {values})
  t.ok(response.key)
})

test('Assignments update', async function(t) {
  const values = {
    oppKey: 'testOpp',
    engagementKey: 'testEngagement',
    teamKey: 'testTeam',
    shiftKey: 'testShift',
  }
  const {key} = await this.act('role:Assignments,cmd:create', {values})
  const response = await this.act('role:Assignments,cmd:update', {key, values: {newValue: true}})
  t.ok(response.key)

  const {assignment} = await this.act('role:Firebase,cmd:get', {assignment: key})
  t.ok(assignment.newValue)
})
