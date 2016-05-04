import {isAdmin, isUser} from './authorization'
// import Promise from 'prfun'
require('prfun/smash')

const sendgrid = require('sendgrid')(process.env['SENDGRID_KEY'])

const create = (values, uid, {gateway, Profiles, Engagements, Projects}) =>
  gateway.generateClientToken()
  .then(({clientToken}) =>
    Engagements.push({...values,
      isApplied: true,
      isAccepted: false,
      isConfirmed: false,
      paymentClientToken: clientToken,
    }).then(ref => ref.key())
      .then(key => {
        sendgrid.send({
          to: 'tlsteinberger167@gmail.com',
          from: 'tsteinberger@sparks.network',
          subject: `You've just created a new engagment!`,
          text: `Congratulations`,
        })
        return key
      })
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
