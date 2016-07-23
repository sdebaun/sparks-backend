import Promise from 'bluebird'
import {
  prop, pathOr, tap, compose, sum, applySpec, map,
} from 'ramda'
import defaults from './defaults'

function actions() {
  const seneca = this

  this.add({role:'Engagements',cmd:'create'}, async function({oppKey, profileKey}) {
    const {clientToken} = await this.act('role:braintree,cmd:generateClientToken')

    const {key} = await this.act('role:Firebase,model:Engagements,cmd:push', {values: {
      oppKey,
      profileKey,
      isApplied: true,
      isAccepted: false,
      isConfirmed: false,
      paymentClientToken: clientToken,
    }})

    await this.act({
      role:'email',
      cmd:'send',
      email:'engagement',
      templateId: '96e36ab7-43b0-4d45-8309-32c52530bd8a',
      subject:'New Engagement for',
      profileKey,
      oppKey,
    })

    return {key}
  })

  const removeAssignments = keys => Promise.all(keys.map(key =>
    seneca.act('role:Firebase,model:Assignments,cmd:remove', {key})
  ))

  const updateShiftCounts = keys => Promise.all(keys.map(key =>
    seneca.act({
      role:'Shifts',
      cmd:'updateCounts',
      key,
    })))

  this.add({role:'Engagements',cmd:'remove'}, async function({key}) {
    const {assignments} = await this.act('role:Firebase,cmd:get', {
      assignments: {engagementKey: key},
    })

    await removeAssignments(assignments.map(prop('$key')))
    await updateShiftCounts(assignments.map(prop('shiftKey')))
    await this.act('role:Firebase,model:Engagements,cmd:remove', {key})

    return {key}
  })

  const OppConfirmationsOn = oppKey =>
    seneca.act('role:Firebase,cmd:get', {opp: oppKey})
      .then(({opp}) => opp.confirmationsOn || false)

  this.add({role:'Engagements',cmd:'sendEmail',email:'accepted'},
          ({key, engagement, uid}, respond) =>
    OppConfirmationsOn(engagement.oppKey)
      .then(confirmationsOn =>
        confirmationsOn ?
          seneca.act({
            role:'email',
            cmd:'send',
            email:'engagement',
            templateId:'dec62dab-bf8e-4000-975a-0ef6b264dafe',
            subject:'Application accepted for',
            profileKey: engagement.profileKey,
            oppKey: engagement.oppKey,
          }) : null
        )
      .then(() => respond(null, engagement))
      .catch(err => respond(err)))

  this.add({role:'Engagements',cmd:'update'}, ({key, values, uid}, respond) =>
    seneca.act('role:Firebase,model:Engagements,cmd:update', {key, values})
      .then(() => seneca.act('role:Firebase,cmd:get', {engagement: key}))
      .then(({engagement}) => {
        if (values.isAccepted) {
          this.act({
            role:'Engagements',
            cmd:'sendEmail',
            email:'accepted',
            key,
            engagement,
            uid,
          }, err => err ? console.error(err) : null)
        }
        return engagement
      })
      .then(({isAssigned, isPaid}) => Boolean(isAssigned && isPaid))
      .then(isConfirmed => seneca.act('role:Firebase,model:Engagements,cmd:update', {key, values: {isConfirmed}}))
      .then(() => respond(null, {key}))
      .catch(err => respond(err)))

  const extractAmount = s =>
    parseInt(`${s}`.replace(/[^0-9\.]/g, ''), 10)

  const calcSparks = (pmt, dep) =>
    (pmt + dep) * 0.035 + 1.0

  const calcNonref = (pmt, dep) => (pmt + calcSparks(pmt, dep)).toFixed(2)

  const makePayment = ({values, key}) => payAmount =>
    seneca.act('role:braintree,cmd:createTransaction', {
      amount: payAmount,
      nonce: values.paymentNonce,
    })
    .then(tap(result => console.log('braintree result:', result.success, result.transaction.status))) // eslint-disable-line max-len
    .then(({success, transaction}) =>
      seneca.act('role:Firebase,model:Engagements,cmd:update', {key, values: {
        transaction,
        amountPaid: transaction.amount,
        isPaid: success,
        isConfirmed: success,
        paymentError: success ? false : transaction.status,
      }})
    )
    .then(() => true)
    .catch(errorResult => {
      console.log('BRAINTREE TRANSACTION ERROR', errorResult)
      seneca.act('role:Firebase,model:Engagements,cmd:update', {key, values: {
        isPaid: false,
        isConfirmed: false,
        paymentError: errorResult.type,
      }})
      return false
    })

  const commitmentPayment = compose(extractAmount, pathOr(0, ['payment', 'amount']))
  const commitmentDeposit = compose(extractAmount, pathOr(0, ['deposit', 'amount']))
  const commitmentTotal = compose(
    sum,
    applySpec([commitmentPayment, commitmentDeposit])
  )

  const commitmentsTotal = compose(sum, map(commitmentTotal))
  const commitmentsAmounts = applySpec({
    payment: compose(sum, map(commitmentPayment)),
    deposit: compose(sum, map(commitmentDeposit)),
  })

  async function oppTotal(oppKey) { // eslint-disable-line
    const {commitments} = await this.act('role:Firebase,cmd:get', {commitments: {oppKey}})
    return commitmentsTotal(commitments)
  }

  async function oppAmounts(oppKey) {
    const {commitments} = await this.act('role:Firebase,cmd:get', {commitments: {oppKey}})
    return commitmentsAmounts(commitments)
  }

  this.add({role:'Engagements',cmd:'confirmWithoutPay'}, async function({key, uid}) {
    const {engagement} = await this.act('role:Firebase,cmd:get', {engagement: key})
    const amount = await oppAmounts(engagement.oppKey)

    if (amount > 0) {
      throw new Error(`Cannot no pay, ${amount} due!`)
    }

    await this.act('role:Firebase,model:Engagements,cmd:update', {key, values: {
      isPaid: true,
      isConfirmed: true,
    }})

    // Send the email in the background
    this.act({role:'Engagements',cmd:'sendEmail',email:'confirmed',key,uid,engagement})

    return {key}
  })

  this.add({role:'Engagements',cmd:'pay'}, async function({key, values, uid}) {
    const {engagement} = await this.act('role:Firebase,cmd:get', {engagement: key})
    const {payment, deposit} = await oppAmounts(engagement.oppKey)
    const nonRef = calcNonref(payment, deposit)

    console.log('payments amount found', nonRef)

    const paymentFn = makePayment({key, values})
    const result = await paymentFn(nonRef)

    if (result) {
      // Send email
      const {engagement: refreshed} = this.act('role:Firebase,cmd:get', {engagement: key})
      await this.act('role:Engagements,cmd:sendEmail,email:confirmed', {key, uid, engagement: refreshed})
    }

    return {key}
  })

  this.add({role:'Engagements',cmd:'sendEmail',email:'confirmed'},
          ({key, engagement, uid}, respond) =>
    seneca.act({
      role:'email',
      cmd:'send',
      email:'engagement',
      subject: 'Your are confirmed for',
      templateId: 'b1180393-8841-4cf4-9bbd-4a8602a976ef',
      profileKey: engagement.profileKey,
      oppKey: engagement.oppKey,
    })
    //.then(info => scheduleReminderEmail(info, Assignments, Shifts))
    .then(() => respond(null, {key}))
    .catch(err => respond(err)))

  this.add({role:'Engagements',cmd:'updateAssignmentCount'}, async function({key, by}) {
    const {model} = await this.act('role:Firebase,cmd:Model,model:Engagements')
    const ref = model.child(key).child('assignmentCount')
    await ref.transaction(count => (count || 0) + by)
    return {key}
  })

  return defaults(this, 'Engagements').init()
}

export default actions
