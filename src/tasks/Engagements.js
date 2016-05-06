/* eslint max-nested-callbacks: 0 */
// import {isAdmin, isUser} from './authorization'
// import Promise from 'prfun'
// import moment from 'moment'

require('prfun/smash')

const sendgrid = require('sendgrid')(process.env['SENDGRID_KEY'])
const DOMAIN = process.env['DOMAIN']

function getEmailInfo({key, oppKey, uid, Profiles, Opps, Projects}) {
  return Promise.all([Profiles.first('uid', uid), Opps.get(oppKey)])
    .then(([profile, opp]) =>
      Projects.get(opp.projectKey)
        .then(project => ({project, opp, user: profile, key, uid}))
    )
}

function sendEngagmentEmail({user, project, opp, key, uid}, {templateId, subject, sendAt = false}) { // eslint-disable-line max-len
  const email = new sendgrid.Email()
  email.addTo(user.email)
  email.subject = subject + ` ${project.name}`
  email.from = 'help@sparks.network'
  email.html = ' '

  email.addFilter('templates', 'enable', 1)
  email.addFilter('templates', 'template_id', templateId)

  email.addSubstitution('-username-', user.fullName)
  email.addSubstitution('-opp_name-', opp.name)
  email.addSubstitution('-project_name-', project.name)
  email.addSubstitution('-engagementurl-', `${DOMAIN}/engaged/${key}/`)

  if (sendAt) { email.setSendAt(sendAt) }

  sendgrid.send(email, (err, json) => {
    if (err) { return console.error(err) }
    console.log(json)
  })

  return arguments[0]
}
/*
function scheduleReminderEmail(info, Assignments, Shifts) {
  return console.log('info', info) || Assignments.by('profileKey', info.uid)
    .then(assignments => console.log(assignments) || assignments.filter(a => a.engagementKey === info.key)) // eslint-disable-line
    .then(assignments => assignments[0])
    .then(assignment => Shifts.get(assignment.shiftKey))
    .then(shift => {
      const sendAt = moment(shift.date).subtract(7, 'days').unix()
      console.log(sendAt, moment(Date.now()))
      console.log(sendAt.diff(moment(Date.now(), 'Days')))
      if (sendAt.diff(moment(Date.now(), 'Days')) >= 7) {
        // schedule for future if its more than a week away
        return sendEngagmentEmail(info, {
          subject: 'Reminder for',
          templateId: '2d01fe18-b230-4e92-b234-26e14b30cd30',
          sendAt,
        })
      }
      return sendEngagmentEmail(info, {
        subject: 'Reminder for',
        templateId: '2d01fe18-b230-4e92-b234-26e14b30cd30',
      })
    })
}*/

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
          getEmailInfo({key, uid, oppKey: values.oppKey, Profiles, Opps, Projects}) // eslint-disable-line max-len
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

const update = ({key, values}, uid, {Engagements, Profiles, Opps, Projects}) => { //eslint-disable-line max-len
  // const isConfirmed = !!(values.isAssigned && values.isPaid)

  // Engagements.child(key).update({...values, isConfirmed}).then(ref => key)
  Engagements.child(key).update(values)
    .then(() => Engagements.get(key))
    .then(engagment => {
      if (values.isAccepted) {
        return getEmailInfo({key, oppKey: engagment.oppKey, uid, Profiles, Opps, Projects}) // eslint-disable-line max-len
          .then(info => sendEngagmentEmail(info, {
            templateId: 'dec62dab-bf8e-4000-975a-0ef6b264dafe',
            subject: 'Application accepted for',
          }))
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
          getEmailInfo({key, oppKey: engagement.oppKey, uid, Profiles, Opps, Projects}) // eslint-disable-line max-len
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
