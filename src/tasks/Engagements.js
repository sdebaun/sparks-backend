import {isAdmin, isUser} from './authorization'

const create = (values, uid, {gateway, Profiles, Engagements, Projects}) =>
  gateway.generateClientToken()
  // .then(response => response.clientToken)
  // new Promise((resolve) =>
  //   gateway.clientToken.generate({}, (err,response) =>
  //     resolve(response.clientToken)
  //   )
  // )
  .then(({clientToken}) =>
    Engagements.push({...values,
      isApplied: true,
      isAccepted: false,
      isConfirmed: false,
      paymentClientToken: clientToken,
    }).then(ref => ref.key())
  )

const remove = (key, uid, {Profiles, Engagements, Projects}) =>
  Promise.all([
    Profiles.first('uid', uid),
    Engagements.get(key),
  ])
  .then(([user, fulfiller]) =>
    Engagements.child(key).remove() && key
  )

const update = ({key, values}, uid, {Engagements}) =>
  Engagements.child(key).update(values).then(ref => key)

const extractAmount = s =>
  parseInt(s.replace(/[^0-9\.]/g, ''), 10)

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
  // .then(amounts => console.log('payment amounts found', amounts))
  .then(amounts =>
    gateway.createTransaction({
      amount: amounts.payment,
      paymentMethodNonce: values.paymentNonce,
    }, {
      submitForSettlement: true,
    })
    .then(({transaction}) =>
      Engagements.child(key).update({
        transaction,
        amountPaid: transaction.amount,
        isPaid: true,
      })
    )
    .then(() => key)
    .catch(errorResult => console.log('BRAINTREE TRANSACTION ERROR', errorResult))
  )

export default {
  create,
  remove,
  update,
  pay,
}
