/* eslint max-nested-callbacks: 0 */
// import {isAdmin, isUser} from './authorization'
// import Promise from 'prfun'
require('prfun/smash')

const sendgrid = require('sendgrid')(process.env['SENDGRID_KEY'])
const DOMAIN = process.env['DOMAIN']

const getVal = p => p.once('value').then(s => s.val())

function sendCreatedEmail({user, project, opp, key}) {
  const email = new sendgrid.Email()
  email.addTo(user.email)
  email.subject = `New engagment for ${project.name}!`
  email.from = 'help@sparks.network'
  email.html = ' '

  email.addFilter('templates', 'enable', 1)
  email.addFilter('templates', 'template_id',
    '96e36ab7-43b0-4d45-8309-32c52530bd8a')

  email.addSubstitution('-username-', user.fullName)
  email.addSubstitution('-opp_name-', opp.name)
  email.addSubstitution('-project_name-', project.name)
  email.addSubstitution('-engagementurl-',
    `${DOMAIN}/engaged/${key}/`)

  sendgrid.send(email, (err, json) => {
    if (err) { return console.error(err) }
    console.log(json)
  })
}

const create =
  (values, uid, {gateway, Profiles, Engagements, Opps, Projects}) =>
    gateway.generateClientToken()
    .then(({clientToken}) =>
      Engagements.push({...values,
        isApplied: true,
        isAccepted: false,
        isConfirmed: false,
        paymentClientToken: clientToken,
      }).then(ref => ref.key())
        .then(key =>
          Promise.all([
            Profiles.first('uid', uid),
            getVal(Opps.child(values.oppKey)),
          ])
          .then(([user, opp]) =>
            getVal(Projects.child(opp.projectKey))
              .then(project => sendCreatedEmail({user, opp, project, key}))
              .then(() => key)
          )
        )
    )

import {updateCounts} from './Assignments'

const remove = (key, uid, {Assignments, Engagements, Shifts}) =>
  Assignments.by('engagementKey', key)
  .then(engs => Promise.all(engs.map(({$key}) => Assignments.get($key))))
  .then(assigns =>
    Promise.all(assigns.map(({$key}) => Assignments.child($key).remove()))
    .then(Promise.all(assigns.map(({shiftKey}) =>
      updateCounts(shiftKey, {Assignments, Shifts})
    )))
  )
  .then(() => Engagements.child(key).remove())
  .then(() => key)

  // Promise.all([
  //   Profiles.first('uid', uid),
  //   Engagements.get(key),
  // ])
  // .then(([user, fulfiller]) =>
  //   Assignments.by('engagementKey', key)
  //     .
  //   Promise.all([
  //     Assignments.

  //   ])
  //   .then(() => Engagements.child(key).remove())
  // )

const update = ({key, values}, uid, {Engagements}) => {
  // const isConfirmed = !!(values.isAssigned && values.isPaid)

  // Engagements.child(key).update({...values, isConfirmed}).then(ref => key)
  Engagements.child(key).update(values)
    .then(() => Engagements.get(key))
    .then(({isAssigned, isPaid}) => isAssigned && isPaid)
    .then(isConfirmed => Engagements.child(key).update({isConfirmed}))
    .then(() => key)
}

const extractAmount = s =>
  parseInt(`${s}`.replace(/[^0-9\.]/g, ''), 10)

const calcSparks = (pmt, dep) =>
  (pmt + dep) * 0.035 + 1.0

const calcNonref = (pmt, dep) => (pmt + calcSparks(pmt, dep)).toFixed(2)

const pay = ({key, values}, uid, {Engagements, Commitments, gateway}) =>
  Engagements.get(key).then(({oppKey}) =>
    Commitments.by('oppKey', oppKey)
  )
  .then(commits => ({
    payment: commits.find(({code}) => code === 'payment'),
    deposit: commits.find(({code}) => code === 'deposit'),
  }))
  .then(c => ({
    payment: extractAmount(c.payment && c.payment.amount || 0),
    deposit: extractAmount(c.deposit && c.deposit.amount || 0),
  }))
  .then(c =>
    calcNonref(extractAmount(c.payment),extractAmount(c.deposit))
  )
  // .then(amounts => console.log('payment amounts found', amounts))
  .tap(c => console.log('payment amounts found', c))
  .then(payAmount =>
    gateway.createTransaction({
      amount: payAmount,
      paymentMethodNonce: values.paymentNonce,
    }, {
      // verifyCard: true,
      submitForSettlement: true,
    })
    .tap(result => console.log('braintree result:', result.success, result.transaction.status))
    .then(({success, transaction}) =>
      Engagements.child(key).update({
        transaction,
        amountPaid: transaction.amount,
        isPaid: success,
        isConfirmed: success,
        paymentError: success ? false : transaction.status,
      })
    )
    .then(() => key)
    .catch(errorResult => {
      console.log('BRAINTREE TRANSACTION ERROR', errorResult)
      Engagements.child(key).update({
        isPaid: false,
        isConfirmed: false,
        paymentError: errorResult.type,
      })
    })
  )

export default {
  create,
  remove,
  update,
  pay,
}
