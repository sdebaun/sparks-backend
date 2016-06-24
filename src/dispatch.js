import Promise from 'bluebird'
import FirebaseQueue from 'firebase-queue'
import {when, compose, equals, keys, prop} from 'ramda'

const log = (...m) => console.log(...m)

const objectOrKey = when(
  compose(
    equals(['key']),
    keys
  ),
  prop('key')
)

const buildResponse = (domain, event, payload) => ({
  domain, event, payload: payload || false,
})

export const startDispatch = (ref, seneca) => {
  const respond = (uid, response) => {
    log('responding with', response)
    ref.child('responses').child(uid).push(response)
  }

  async function handle({domain, action, uid, payload}) {
    const pattern = {
      role: domain,
      cmd: action,
      uid,
      ...payload,
    }

    console.log('Auth', pattern)

    try {
      const auth = await seneca.act({
        ...pattern,
        role: 'Auth',
        model: pattern.role,
      })

      if (auth.reject) {
        log('queue unauthorized',
          auth.reject, domain, action, uid, payload)
        return {reject: auth.reject}
      }

      log('auth successful')
      log('acting with', {
        ...pattern,
        ...auth,
      })

      try {
        const response = await seneca.act({
          ...pattern,
          ...auth,
        })

        respond(
          uid,
          buildResponse(domain, action, objectOrKey(response))
        )
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
