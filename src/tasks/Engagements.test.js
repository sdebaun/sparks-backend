import tape from 'test/tape-seneca'
import Engagements from './Engagements'
import {append} from 'ramda'

function braintree() {
  this.add('role:gateway,cmd:generateClientToken', async function() {
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
test.only = tapeTest.only

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

test('update / volunteer', async function(t) {
  const response = await this.act('role:Engagements,cmd:update,userRole:volunteer', {key: 'volunteer', values: {
    answer: 'yes no wait?',
    oppKey: 'greatOpp',
    isAssigned: true,
    isAccepted: true,
    isConfirmed: true,
    amountPaid: 5000,
    isPaid: true,
    paymentClientToken: 'dontbeafool',
  }})

  t.ok(response.key)

  const {engagement: eng} = await this.act('role:Firebase,cmd:get', {engagement: response.key})
  t.ok(eng)
  t.equal(eng.answer, 'yes no wait?', 'can update answer')
  t.equal(eng.oppKey, 'oppOne', 'cannot change opp')
  t.equal(eng.isAssigned, true, 'can change isAssigned')
  t.equal(eng.isAccepted, false, 'cannot change isAccepted')
  t.equal(eng.isConfirmed, false, 'cannot confirm themself')
  t.notOk(eng.amountPaid, 'cannot set paid amount')
  t.notOk(eng.isPaid, 'cannot mark isPaid')
  t.equal(eng.paymentClientToken, 'imaprettyboy', 'cannot change payment token')
})

test('update / project owner', async function(t) {
  const response = await this.act('role:Engagements,cmd:update,userRole:project', {key: 'volunteer', values: {
    answer: 'yes no wait?',
    oppKey: 'greatOpp',
    isAssigned: true,
    isAccepted: true,
    isConfirmed: true,
    amountPaid: 5000,
    isPaid: true,
    paymentClientToken: 'dontbeafool',
  }})

  t.ok(response.key)

  const {engagement: eng} = await this.act('role:Firebase,cmd:get', {engagement: response.key})
  t.ok(eng)
  t.equal(eng.answer, 'the proof is in the pudding', 'cannot update answer')
  t.equal(eng.oppKey, 'oppOne', 'cannot change opp')
  t.equal(eng.isAssigned, true, 'can change isAssigned')
  t.equal(eng.isAccepted, true, 'can change isAccepted')
  t.equal(eng.isConfirmed, false, 'cannot confirm manually')
  t.notOk(eng.amountPaid, 'cannot set paid amount')
  t.notOk(eng.isPaid, 'cannot mark isPaid')
  t.equal(eng.paymentClientToken, 'imaprettyboy', 'cannot change payment token')
})
