import Inflection from 'inflection'
import {
  keys, objOf, values, whereEq, find, mergeAll, filter, mapObjIndexed,
} from 'ramda'

function mockFirebase() {
  const store = {}

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

  this.add({role:'Firebase',cmd:'get'}, async function(msg) {
    return get(msg)
  })
}

export default mockFirebase
