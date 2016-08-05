import {compose, mergeAll, reject, equals, type, last} from 'ramda'

/**
 * Take an array of objects or functions, remove any functions and merge all
 * the objects
 */
const merge = compose<Array<Object | Function>, Object[], any>(
  mergeAll,
  reject(compose(equals('Function'), type))
)

export default function(test) {
  return {
    accepts: function accepts(...msgs) {
      const testFn = typeof last(msgs) === 'function' ? last(msgs) : test
      const msg = merge(msgs)

      testFn(`${msg.model} ${msg.cmd} / accepts ${msg.uid}`, async function(t) {
        const response = await this.act('role:Auth', msg)
        t.false(response.reject, 'it is accepted')
      })
    },

    rejects: function rejects(...msgs) {
      const testFn = typeof last(msgs) === 'function' ? last(msgs) : test
      const msg = merge(msgs)

      testFn(`${msg.model} ${msg.cmd} / rejects ${msg.uid}`, async function(t) {
        const response = await this.act('role:Auth', msg)
        t.ok(response.reject, 'it is rejected')
      })
    },
  }
}
