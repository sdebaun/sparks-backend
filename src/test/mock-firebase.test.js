import tapeTest from 'tape-async'
import Seneca from 'seneca-await'
import mockFirebase from 'test/mock-firebase'
import {prop} from 'ramda'

const seneca = Seneca()
seneca.use(mockFirebase)

const people = {
  vince: {
    name: 'Vince Noir',
    eyeSize: 'normal',
  },

  howard: {
    name: 'Howard Moon',
    eyeSize: 'small',
  },

  fossil: {
    name: 'Bob Fossil',
    eyeSize: 'normal',
  },
}

seneca.ready(function() {
  function test(msg, fn, testFn = tapeTest) {
    const bound = fn.bind(seneca)

    async function fnWithRestore(t) {
      await seneca.act('role:Fixtures,cmd:set', {fixtures: {people}})
      await bound(t)
    }

    testFn(`mockFirebase / ${msg}`, fnWithRestore)
  }
  test.only = function(msg, fn) { test(msg, fn, tapeTest.only) }

  test('Fixtures / set / get', async function(t) {
    const store = await this.act('role:Fixtures,cmd:get')
    const vince = store.people.vince

    t.ok(people)
    t.ok(vince)
    t.equal(vince.name, 'Vince Noir', 'It has the name')
    t.equal(vince.$key, 'vince', 'It sets the key')
  })

  test('Fixtures / snapshot / restore', async function(t) {
    let store

    await this.act('role:Fixtures,cmd:snapshot')
    const {key} = await this.act('role:Firebase,cmd:push,model:People', {values: {name: 'Naboo the Enigma'}})
    store = await this.act('role:Fixtures,cmd:get')
    const naboo = store.people[key]
    t.ok(naboo)
    t.equal(naboo.name, 'Naboo the Enigma')

    await this.act('role:Fixtures,cmd:restore')
    store = await this.act('role:Fixtures,cmd:get')
    t.false(store.people[key])
    t.ok(store.people.vince)
  })

  test('Firebase / get', async function(t) {
    const fossil = await this.act('role:Firebase,cmd:get,model:People', {key: 'fossil'})
    t.ok(fossil)
    t.equal(fossil.name, 'Bob Fossil')
  })

  test('Firebase / first', async function(t) {
    const howard = await this.act('role:Firebase,model:People,cmd:first', {by: 'name', value: 'Howard Moon'})
    t.ok(howard, 'fetches the record')
    t.equal(howard.eyeSize, 'small', 'record has correct information')
  })

  test('Firebase / by', async function(t) {
    const eyeeye = await this.act('role:Firebase,model:People,cmd:by', {by: 'eyeSize', value: 'normal'})
    t.equal(eyeeye.length, 2)
    t.looseEqual(eyeeye.map(prop('$key')).sort(), ['fossil', 'vince'])
  })

  test('Firebase / Users / set', async function(t) {
    await this.act('role:Firebase,model:Users,cmd:set,uid:123,profileKey:abc')
    const store = await this.act('role:Fixtures,cmd:get')
    t.ok(store.users)
    t.equal(store.users['123'], 'abc')
  })

  test('Firebase / Users / get', async function(t) {
    await this.act('role:Firebase,model:Users,cmd:set,uid:123,profileKey:abc')
    const user = await this.act('role:Firebase,model:Users,cmd:get,uid:123')
    t.ok(user)
    t.equal(user.profileKey, 'abc')
  })

  test('Firebase / push', async function(t) {
    const {key} = await this.act('role:Firebase,cmd:push,model:People', {values: {name: 'Naboo the Enigma'}})
    const naboo = await this.act('role:Firebase,cmd:get,model:People', {key})
    t.ok(key, 'it generated a key')
    t.ok(naboo, 'it added a record')
    t.equal(naboo.name, 'Naboo the Enigma', 'it set the record value')

    const {key: key2} = await this.act('role:Firebase,cmd:push,model:People', {values: {name: 'Leroy'}})
    t.ok(key2, 'it generated another key')
    t.notEqual(key2, key, 'that is different from the first')
  })

  test('Firebase / update', async function(t) {
    await this.act('role:Firebase,model:People,cmd:update,key:howard', {values: {eyeSize: 'tiny'}})
    const howard = await this.act('role:Firebase,model:People,cmd:get,key:howard')
    t.equal(howard.eyeSize, 'tiny', 'it updated the value')
    t.equal(howard.name, 'Howard Moon', 'but not the name')
  })

  test('Firebase / update / no record', async function(t) {
    const response = await this.act('role:Firebase,model:People,cmd:update,key:naboo', {values: {eyeSize: 'normal'}})
    t.equal(response.error, 'Item not found')
  })

  test('Firebase / remove', async function(t) {
    const response = await this.act('role:Firebase,model:People,cmd:remove,key:howard')
    t.equal(response.key, 'howard')
    const howard = await this.act('role:Firebase,model:People,cmd:get,key:howard')
    t.false(howard, 'record not found')
  })
})
