import tapeTest from 'tape-async'
import Seneca from 'seneca-await'
import mockFirebase from 'test/mock-firebase'
import fixtures from 'test/fixtures'
import {concat} from 'ramda'

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
        testFn(msg, fn.bind(seneca))
      })
  }

  test.only = (msg, fn) => test(msg, fn, tapeTest.only)

  return test
}

export default tape
