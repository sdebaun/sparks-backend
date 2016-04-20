const objToRows = obj =>
  obj && Object.keys(obj).map(k => ({$key: k, ...obj[k]})) || []

const byChildKey = root => (field, key) => {
  console.log('Looking up',field,'of',key)
  return root.orderByChild(field).equalTo(key).once('value')
  .then(snap => objToRows(snap.val()))
}

const firstByChildKey = root => (field, key) =>
  byChildKey(root)(field,key)
  .then(rows => rows.length > 0 && rows[0])

// const byChildKey = root => (field, key) =>
//   root.orderByChild(field).equalTo(key).once('value')
//   .then(snap => snap.val())

const byKey = root => key =>
  root.child(key).once('value')
  .then(snap => ({$key: key, ...snap.val()}))

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

