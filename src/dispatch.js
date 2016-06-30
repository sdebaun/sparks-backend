import Promise from 'bluebird'
import FirebaseQueue from 'firebase-queue'
import {when, compose, equals, keys, prop} from 'ramda'

const log = (...m) => console.log(...m)

const buildResponse = (domain, event, payload) => ({
  domain, event, payload: payload || false,
})

export const startDispatch = (ref, seneca) => {
  const act = Promise.promisify(seneca.act, {context: seneca})

  const respond = (uid, response) => {
    log('responding with', response)
    ref.child('responses').child(uid).push(response)
  }

  const handle = ({domain, action, uid, payload}, progress, resolve) => {
    console.log('Acting on', {
      role: domain,
      cmd: action,
      uid,
    })

    act({
      role: domain,
      cmd: action,
      uid,
      ...payload,
    })
    // Seneca requires that all responses are either arrays or objects.
    // Previously we just returned keys, so where we return an object with only
    // a key this converts back to a string.
    .then(when(compose(equals(['key']), keys), prop('key')))
    .then(result => respond(uid, buildResponse(domain, action, result)))
    .catch(err => log('queue error', err, domain, action, uid, payload))
    .then(resolve)
  }

  return new FirebaseQueue(ref, handle)
}
