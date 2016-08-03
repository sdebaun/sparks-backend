/* eslint max-nested-callbacks: 0, max-len:160 */
import Promise from 'bluebird'
import {prop, reduce, pathOr, flip, when, gt, always, tap} from 'ramda'

function actions({gateway, models}) {
  const {Assignments, Engagements, Opps, Commitments} = models
  const act = Promise.promisify(this.act, {context: this})

  this.add({role:'Engagements',cmd:'create'}, ({oppKey, profileKey, uid}, respond) =>
      gateway.generateClientToken()
      .then(({clientToken}) =>
        Promise.resolve(
          Engagements.push({
            oppKey,
            profileKey,
            isApplied: true,
            isAccepted: false,
            isConfirmed: false,
            paymentClientToken: clientToken,
          }))
        .then(ref => ref.key())
        .then(key =>
          act({
            role:'email',
            cmd:'getInfo',
            key,
            profileKey: profileKey,
            uid,
            oppKey: oppKey,
          })
          .then(info =>
            act({
              role:'email',
              cmd:'send',
              email:'engagement',
              templateId: '96e36ab7-43b0-4d45-8309-32c52530bd8a',
              subject:'New Engagement for',
              ...info,
            })
          )
          .then(() => key)
        )
      )
      .then(key => respond(null, {key}))
      .catch(err => respond(err)))

  const removeAssignments = keys => Promise.all(keys.map(key =>
    Assignments.child(key).remove()))
  const updateShiftCounts = keys => Promise.all(keys.map(key =>
    act({
      role:'Shifts',
      cmd:'updateCounts',
      key,
    })))

  this.add({role:'Engagements',cmd:'remove'}, ({key, uid}, respond) =>
    Assignments.by('engagementKey', key)
    .then(engs => Promise.all(engs.map(({$key}) => Assignments.get($key))))
    .then(assigns =>
      removeAssignments(assigns.map(prop('$key')))
        .then(() => updateShiftCounts(assigns.map(prop('shiftKey'))))
    )
    .then(() => Engagements.child(key).remove())
    .then(() => respond(null, {key}))
    .catch(err => respond(err)))

  const OppConfirmationsOn = oppKey =>
    Opps.get(oppKey)
      .then(opp => opp.confirmationsOn || false)

  this.add({role:'Engagements',cmd:'sendEmail',email:'accepted'},
          ({key, engagement, uid}, respond) =>
    Promise.props({
      confirmationsOn: OppConfirmationsOn(engagement.oppKey),
      emailInfo: act({
        role:'email',
        cmd:'getInfo',
        key,
        profileKey: engagement.profileKey,
        oppKey: engagement.oppKey,
        uid,
      }),
    })
    .then(({confirmationsOn, emailInfo}) =>
      confirmationsOn ?
        act({
          role:'email',
          cmd:'send',
          email:'engagement',
          templateId:'dec62dab-bf8e-4000-975a-0ef6b264dafe',
          subject:'Application acceted for',
          ...emailInfo,
        }) : null
      )
    .then(() => respond(null, engagement))
    .catch(err => respond(err)))

  this.add({role:'Engagements',cmd:'update'}, ({key, values, uid}, respond) =>
    Engagements.child(key).update(values)
      .then(() => Engagements.get(key))
      .then(engagement => {
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
      .then(isConfirmed => Engagements.child(key).update({isConfirmed}))
      .then(() => respond(null, {key}))
      .catch(err => respond(err)))

  const extractAmount = s =>
    parseInt(`${s}`.replace(/[^0-9\.]/g, ''), 10)

  const calcSparks = (pmt, dep) =>
    (pmt + dep) * 0.035 + 1.0

  const calcNonref = (pmt, dep) => (pmt + calcSparks(pmt, dep)).toFixed(2)

  const makePayment = ({values, key}) => payAmount =>
    gateway.createTransaction({
      amount: payAmount,
      paymentMethodNonce: values.paymentNonce,
    }, {
      // verifyCard: true,
      submitForSettlement: true,
    })
    .then(tap(result => console.log('braintree result:', result.success, result.transaction.status))) // eslint-disable-line max-len
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

  this.add({role:'Engagements',cmd:'confirmWithoutPay'}, ({key, uid}, respond) =>
    Engagements.get(key)
    .then(engagement =>
      Commitments.by('oppKey', engagement.oppKey)
      .then(reduce((acc, c) =>
              acc + pathOr(0, ['payment', 'amount'], c) +
                    pathOr(0, ['deposit', 'amount'], c),
                    0))
      .then(amount => {
        if (amount > 0) {
          console.log(amount)
          return Promise.reject(`Cannot no pay, ${amount} due!`)
        }
      })
      .then(() =>
        Engagements.child(key).update({
          isPaid: true,
          isConfirmed: true,
        })
      )
      .then(() => {
        // Send the email in the background
        act({role:'Engagements',cmd:'sendEmail',email:'confirmed',key,uid,engagement})
      })
      .then(() => respond(null, {key}))
    )
    .catch(err => respond(err))
  )

  this.add({role:'Engagements',cmd:'pay'}, ({key, values, uid}, respond) =>
    Engagements.get(key)
    .then(({oppKey}) => Commitments.by('oppKey', oppKey))
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
    .then(tap(c => console.log('payment amounts found', c)))
    .then(makePayment({key, values}))
    .then(() => Engagements.get(key))
    .then(engagement => {
      // Send the email in the background
      act({
        role:'Engagements',
        cmd:'sendEmail',
        email:'confirmed',
        key,
        uid,
        engagement,
      })
    })
    .then(() => respond(null, {key}))
    .catch(err => respond(err)))

  this.add({role:'Engagements',cmd:'sendEmail',email:'confirmed'},
          ({key, engagement, uid}, respond) =>
    act({
      role:'email',
      cmd:'getInfo',
      key,
      profileKey: engagement.profileKey,
      oppKey: engagement.oppKey,
      uid,
    })
    .then(info => act({
      role:'email',
      cmd:'send',
      email:'engagement',
      subject: 'Your are confirmed for',
      templateId: 'b1180393-8841-4cf4-9bbd-4a8602a976ef',
      ...info,
    }))
    //.then(info => scheduleReminderEmail(info, Assignments, Shifts))
    .then(() => respond(null, {key}))
    .catch(err => respond(err)))
}

export default actions
