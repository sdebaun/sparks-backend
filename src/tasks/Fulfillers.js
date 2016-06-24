import Promise from 'bluebird'
import {pathOr, ifElse} from 'ramda'

function actions({models: {Fulfillers}}) {
  const seneca = this
  const act = Promise.promisify(this.act, {context: this})

  const getOppKey = ifElse(
    pathOr(false, ['values', 'oppKey']),
    msg => Promise.resolve(msg.values.oppKey),
    msg => act({role:'Firebase',cmd:'get',fulfiller: msg.key})
      .then(({fulfiller}) => fulfiller.oppKey)
  )

  this.add({role:'Fulfillers',cmd:'create'}, ({values}, respond) => {
    const key = Fulfillers.push(values).key()
    respond(null, {key})
  })

  this.add({role:'Fulfillers',cmd:'remove'}, ({uid, key}, respond) =>
    act({role:'Firebase',cmd:'get',
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

  this.add({role:'Auth',model:'Fulfillers'}, function(msg, respond) {
    getOppKey(msg)
    .then(oppKey =>
      seneca.act({...msg,oppKey,role:'Auth',model:'Opps',cmd:'update'},
        respond))
  })
}

export default actions
