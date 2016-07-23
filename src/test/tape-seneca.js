import tapeTest from 'tape-async'
import Seneca from 'seneca-await'
import mockFirebase from 'test/mock-firebase'
import firebaseGet from '../firebase-get'
import fixtures from 'test/fixtures'

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

  function test(msg, fn, testFn = tapeTest) {
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

  test.only = (msg, fn) => test(msg, fn, tapeTest.only)
  test.seneca = seneca

  return test
}

export default tape
