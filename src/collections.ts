import {keys, merge} from 'ramda'

export function objToRows(obj) {
  return obj && keys(obj).map(key => merge(obj[key], {$key: key})) || []
}

const byChildKey = root => (field, key) => {
  console.log('Looking up',field,'of',key)
  return root.orderByChild(field).equalTo(key).once('value')
  .then(snap => objToRows(snap.val()))
}

const firstByChildKey = function(root) {
  return function(field, key) {
    return byChildKey(root)(field,key).then(rows => rows.length > 0 && rows[0])
  }
}

const byKey = root => key => {
  console.log(`Looking up ${root.key()} ${key}`)
  return root.child(key).once('value')
    .then(snap => merge(snap.val(), {$key: key}))
}

const createCollectionObject = (fb, name) => {
  const root = fb.child(name)
  root.by = byChildKey(root)
  root.first = firstByChildKey(root)
  root.get = byKey(root)
  return root
}

const addCollection = fb => (a,x) =>
  (a[x] = createCollectionObject(fb, x)) && a

export const makeCollections = (fb, collections) =>
  collections.reduce(addCollection(fb), {})

