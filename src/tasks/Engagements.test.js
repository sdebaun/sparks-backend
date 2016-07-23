import tape from 'test/tape-seneca'
import Engagements from './Engagements'
import {append} from 'ramda'

function braintree() {
  this.add('role:braintree,cmd:generateClientToken', async function() {
    return {clientToken: 'paymenowyoubastard'}
  })

  return 'braintree'
}

let emailsSent = []
function email() {
  this.add('role:email,cmd:send', async function(msg) {
    emailsSent = append(msg, emailsSent)
    return {}
  })

  return 'email'
}

function shifts() {
  // TODO: Test usage of this
  this.add('role:Shifts,cmd:updateCounts', async function() {
    return {}
  })

  return 'shifts'
}

const tapeTest = tape('Engagements', [email, braintree, shifts, Engagements])
function test(...args) {
  emailsSent = []
  tapeTest(...args)
}

test('create', async function(t) {
  const response = await this.act('role:Engagements,cmd:create', {
    oppKey: 'oppOne',
    profileKey: 'volTwo',
    uid: 'volTwo',
  })

  t.ok(response)
  t.ok(response.key)

  const {engagement: eng} = await this.act('role:Firebase,cmd:get', {engagement: response.key})
  t.ok(eng, 'created')
  t.equal(eng.oppKey, 'oppOne', 'oppKey')
  t.equal(eng.profileKey, 'volTwo', 'profileKey')
  t.ok(eng.isApplied, 'isApplied')
  t.equal(eng.isAccepted, false, 'isAccepted is false')
  t.equal(eng.isConfirmed, false, 'isConfirmed is false')
  t.equal(eng.paymentClientToken, 'paymenowyoubastard', 'generated payment client token')

  t.equal(emailsSent.length, 1)
  const email = emailsSent[0]
  t.equal(email.subject, 'New Engagement for')
  t.equal(email.profileKey, 'volTwo')
  t.equal(email.oppKey, 'oppOne')
})

test('remove', async function(t) {
  const {engagement, assignments} = await this.act('role:Firebase,cmd:get', {
    engagement: 'volunteer',
    assignments: {engagementKey: ['engagement', '$key']},
  })

  t.ok(engagement)
  t.equal(assignments.length, 1)

  const response = await this.act('role:Engagements,cmd:remove', {key: 'volunteer'})
  t.equal(response.key, 'volunteer')

  const {engagement: engAfter, assignments: assAfter} = await this.act('role:Firebase,cmd:get', {
    engagement: 'volunteer',
    assignments: {engagementKey: ['engagement', '$key']},
  })

  t.notOk(engAfter)
  t.equal(assAfter.length, 0)
})

test('update', async function(t) {
})

test('confirmWithoutPay', async function(t) {
})

test('pay', async function(t) {
})
