/* eslint max-nested-callbacks: 0 */
require('prfun/smash')
import {getEmailInfo, sendEngagmentEmail} from './emails'

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
          getEmailInfo({key, profileKey: values.profileKey, uid, oppKey: values.oppKey, Profiles, Opps, Projects}) // eslint-disable-line max-len
          .then(info => sendEngagmentEmail(info, {
            templateId: '96e36ab7-43b0-4d45-8309-32c52530bd8a',
            subject: 'New Engagement for',
          }))
          .then(() => key)
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

function OppConfirmationsOn(Opps, oppKey) {
  return Opps.get(oppKey)
    .then(opp => opp.confirmationsOn || false)
}

const update = ({key, values}, uid, {Engagements, Profiles, Opps, Projects}) => { //eslint-disable-line max-len
  // const isConfirmed = !!(values.isAssigned && values.isPaid)

  // Engagements.child(key).update({...values, isConfirmed}).then(ref => key)
  Engagements.child(key).update(values)
    .then(() => Engagements.get(key))
    .then(engagment => {
      if (values.isAccepted) {
        return getEmailInfo({key, profileKey: engagment.profileKey, oppKey: engagment.oppKey, uid, Profiles, Opps, Projects}) // eslint-disable-line max-len
          .then(info => Promise.all([
            OppConfirmationsOn(Opps, engagment.oppKey),
            Promise.resolve(info),
          ]))
          .then(([confirmationsOn, info]) => confirmationsOn ?
            sendEngagmentEmail(info, {
              templateId: 'dec62dab-bf8e-4000-975a-0ef6b264dafe',
              subject: 'Application accepted for',
            }) : null
          )
          .then(() => engagment)
      }
      return engagment
    })
    .then(({isAssigned, isPaid}) => isAssigned && isPaid)
    .then(isConfirmed => Engagements.child(key).update({isConfirmed}))
    .then(() => key)
}

const extractAmount = s =>
  parseInt(`${s}`.replace(/[^0-9\.]/g, ''), 10)

const calcSparks = (pmt, dep) =>
  (pmt + dep) * 0.035 + 1.0

const calcNonref = (pmt, dep) => (pmt + calcSparks(pmt, dep)).toFixed(2)

const pay = ({key, values}, uid, {Engagements, Commitments, gateway, Profiles, Opps, Projects}) => // eslint-disable-line max-len
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
    .tap(result => console.log('braintree result:', result.success, result.transaction.status)) // eslint-disable-line max-len
    .then(({success, transaction}) =>
      Engagements.child(key).update({
        transaction,
        amountPaid: transaction.amount,
        isPaid: success,
        isConfirmed: success,
        paymentError: success ? false : transaction.status,
      })
    )
    .catch(errorResult => {
      console.log('BRAINTREE TRANSACTION ERROR', errorResult)
      Engagements.child(key).update({
        isPaid: false,
        isConfirmed: false,
        paymentError: errorResult.type,
      })
    })
    .then(() => {
      return Engagements.get(key)
        .then(engagement =>
          getEmailInfo({key, profileKey: engagement.profileKey, oppKey: engagement.oppKey, uid, Profiles, Opps, Projects}) // eslint-disable-line max-len
            .then(info => sendEngagmentEmail(info, {
              subject: 'Your are confirmed for',
              templateId: 'b1180393-8841-4cf4-9bbd-4a8602a976ef',
            }))
            //.then(info => scheduleReminderEmail(info, Assignments, Shifts))
            .then(() => key)
        )
    })
  )

export default {
  create,
  remove,
  update,
  pay,
}
