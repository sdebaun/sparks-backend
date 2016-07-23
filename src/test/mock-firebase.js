import Inflection from 'inflection'
import R, {
  keys, objOf, values, whereEq, find, mergeAll, filter, mapObjIndexed, lensPath, propEq,
} from 'ramda'

function mockFirebase() {
  let store = {}
  let snapshot = store

  function set(fixtures) {
    const withKeys = mapObjIndexed(
      (fixture, $key) => ({...fixture, $key})
    )

    for (let key of keys(fixtures)) {
      store[key] = withKeys(fixtures[key])
    }

    return store
  }

  function arrayGet(key, value) {
    const ary = values(store[key]) || []
    return objOf(key, filter(whereEq(value))(ary))
  }

  function modelGet(key, value) {
    const modelName = Inflection.pluralize(key)
    if (!store[modelName]) { return null }

    if (typeof value === 'string') {
      return objOf(key, store[modelName][value])
    } else {
      const ary = values(store[modelName])
      return objOf(key, find(whereEq(value))(ary))
    }
  }

  function get(spec) {
    const results = keys(spec).map(key => {
      const value = spec[key]
      const fn = Inflection.pluralize(key) === key ? arrayGet : modelGet
      return fn(key, value)
    })

    return mergeAll(results)
  }

  this.add({role:'Fixtures',cmd:'set'}, async function(msg) {
    return set(msg.fixtures)
  })

  this.add({role:'Fixtures',cmd:'get'}, async function() {
    return R.clone(store)
  })

  this.add({role:'Fixtures',cmd:'snapshot'}, async function() {
    snapshot = R.clone(store)
    return {}
  })

  this.add({role:'Fixtures',cmd:'restore'}, async function() {
    store = R.clone(snapshot)
    return {}
  })

  this.add({role:'Firebase',cmd:'get'}, async function(msg) {
    return store[msg.model.toLowerCase()][msg.key]
  })

  this.add({role:'Firebase',cmd:'first'}, async function(msg) {
    const ary = values(store[msg.model.toLowerCase()])
    return find(propEq(msg.by, msg.value))(ary)
  })

  this.add({role:'Firebase',cmd:'by'}, async function(msg) {
    const ary = values(store[msg.model.toLowerCase()])
    return filter(propEq(msg.by, msg.value))(ary)
  })

  function generateKey() {
    return ('0000' + (Math.random() * Math.pow(36,4) << 0).toString(36)).slice(-4)
  }

  this.add({role:'Firebase',cmd:'set'}, async function({model, key, values}) {
    const lens = lensPath([model.toLowerCase(), key])
    store = R.set(lens, values)
    return {key}
  })

  this.add({role:'Firebase',cmd:'set',model:'Users'}, async function({uid, profileKey}) {
    const lens = lensPath(['users', uid])
    store = R.set(lens, profileKey, store)
    return {uid}
  })

  this.add({role:'Firebase',cmd:'get',model:'Users'}, async function({uid}) {
    const lens = lensPath(['users', uid])
    const profileKey = R.view(lens, store)
    return {profileKey}
  })

  this.add({role:'Firebase',cmd:'push'}, async function(msg) {
    const {values, model} = msg
    const key = generateKey()

    const lens = lensPath([model.toLowerCase(), key])
    store = R.set(lens, {...values, $key: key}, store)

    return {key}
  })

  this.add({role:'Firebase',cmd:'update'}, async function(msg) {
    const {key, values, model} = msg
    const lens = lensPath([model.toLowerCase(), key])
    const item = R.view(lens, store)

    if (!item) {
      return {error: 'Item not found'}
    } else {
      const newItem = {...item, ...values}
      store = R.set(lens, newItem, store)
      return {key}
    }
  })

  this.add({role:'Firebase',cmd:'remove'}, async function({model, key}) {
    const path = [model.toLowerCase(), key]
    store = R.dissocPath(path, store)
    return {key}
  })
}

export default mockFirebase
