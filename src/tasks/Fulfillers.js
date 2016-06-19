import Promise from 'bluebird'
import {pathOr, ifElse} from 'ramda'

function actions({getStuff, models: {Fulfillers}, auths: {userCanUpdateOpp}}) {
  const getOppKey = ifElse(
    pathOr(false, ['values', 'oppKey']),
    msg => Promise.resolve(msg.values.oppKey),
    msg => getStuff({fulfiller: msg.key})
      .then(({fulfiller}) => fulfiller.oppKey)
  )

  this.add({role:'Fulfillers',cmd:'create'}, ({values}, respond) => {
    const key = Fulfillers.push(values).key()
    respond(null, {key})
  })

  this.add({role:'Fulfillers',cmd:'remove'}, ({uid, key}, respond) =>
    getStuff({
      profile: {uid},
      fulfiller: key,
    })
    .then(() => Fulfillers.child(key).remove())
    .then(() => respond(null, {key}))
    .catch(err => respond(err)))

  this.add({role:'Fulfillers',cmd:'update'}, ({key, values}, respond) =>
    Fulfillers.child(key).update(values)
    .then(() => respond(null, {key}))
    .catch(err => respond(err)))

  this.wrap({role:'Fulfillers'}, function(msg, respond) {
    getOppKey(msg)
    .then(oppKey => userCanUpdateOpp({uid: msg.uid, oppKey}))
    .then(data => this.prior({...msg, ...data}, respond))
    .catch(err => respond(err))
  })
}

export default actions
