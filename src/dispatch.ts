/// <reference path="./firebase-queue.d.ts" />
import * as FirebaseQueue from 'firebase-queue'
import {when, compose, equals, keys, prop, merge} from 'ramda'

const log = console.log.bind(console)

const objectOrKey = when(
  compose(
    equals(['key']),
    keys
  ),
  prop('key')
)

const buildResponse = (domain, event, payload):PayloadResponse => ({
  domain, event, payload: payload || false,
})

/**
* Process the firebase queue and turn messages there into seneca tasks.
*/
export const startDispatch = (ref, seneca) => {
  const respond = (uid, response) => {
    log('responding with', response)
    ref.child('responses').child(uid).push(response)
  }

  async function handle({domain, action, uid, payload}):Promise<DispatchResponse> {
    const pattern = merge({
      role: domain,
      cmd: action,
      uid,
    }, payload)

    console.log('Auth', pattern)

    try {
      // Perform authorization on the call. If the auth returns an object with
      // reject then this message won't be processed.
      const auth = await seneca.act(merge(pattern, {
        role: 'Auth',
        model: pattern.role,
      }))

      // If rejected then log it and return it
      if (auth.reject) {
        log('queue unauthorized',
          auth.reject, domain, action, uid, payload)
        return {reject: auth.reject}
      }

      log('auth successful')
      log('acting with', merge(pattern, auth))

      try {
        // Execute the pattern and also mix in the auth results in case they
        // are useful to the task
        const taskResponse = await seneca.act(merge(pattern, auth))
        const response = buildResponse(domain, action, objectOrKey(taskResponse))
        respond(uid, response)
        return response
      } catch (err) {
        log('queue error', err, domain, action, uid, payload)
      }
    } catch (authErr) {
      log('queue error', authErr, domain, action, uid, payload)
      return {error: authErr.toString()}
    }
  }

  return new FirebaseQueue(ref, function(data, progress, resolve, reject) { // eslint-disable-line max-params, max-len
    handle(data)
      .then(resolve)
      .catch(reject)
  })
}
