/// <reference path="../tape-async.d.ts" />
import * as tapeTest from 'tape-async'
import * as Seneca from 'seneca-await'
import mockFirebase from './mock-firebase'
import firebaseGet from '../firebase-get'
import fixtures from './fixtures'

function tape(namespace, plugins) {
  const seneca = Seneca({
    log: {
      map: [
        {level: 'all', handler: function() {}},
      ],
    },
  })

  seneca
    .use(mockFirebase)
    .use(firebaseGet)
    .use(fixtures)

  for (let plugin of plugins) {
    seneca.use(plugin)
  }

  function testFn(msg, fn, testFn = tapeTest) {
    seneca
      .ready(function() {
        const bound = fn.bind(seneca)

        async function testWithRollback(t) {
          await seneca.act('role:Fixtures,cmd:snapshot')
          try {
            await bound(t)
          } finally {
            await seneca.act('role:Fixtures,cmd:restore')
          }
        }

        testFn(`${namespace} / ${msg}`, testWithRollback)
      })
  }

  const test = testFn as any

  test.only = (msg, fn) => test(msg, fn, tapeTest.only)
  test.seneca = seneca

  return test
}

export default tape
