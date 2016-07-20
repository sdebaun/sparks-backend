import tapeTest from 'tape-async'
import Seneca from 'seneca-await'
import mockFirebase from 'test/mock-firebase'
import fixtures from 'test/fixtures'

function tape(plugins) {
  const seneca = Seneca()

  seneca
    .use(mockFirebase)
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
            return await bound(t)
          } finally {
            await seneca.act('role:Fixtures,cmd:restore')
          }
        }

        testFn(msg, testWithRollback)
      })
  }

  test.only = (msg, fn) => test(msg, fn, tapeTest.only)

  return test
}

export default tape
