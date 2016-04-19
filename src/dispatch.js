import FirebaseQueue from 'firebase-queue'

const log = (...m) => console.log(...m)

const buildResponse = (domain, event, payload) => ({
  domain, event, payload: payload || false,
})

export const startDispatch = (ref, remote, tasks) => {
  const respond = (uid, response) => {
    log('responding with', response)
    ref.child('responses').child(uid).push(response)
  }

  const getHandler = (dom, act) =>
    new Promise((resolve,reject) => {
      if (!tasks[dom]) { reject(`Domain not found: ${dom}/${act}`) }
      if (!tasks[dom][act]) { reject(`Action not found: ${dom}/${act}`) }
      resolve(tasks[dom][act])
    })

  const handle = ({domain, action, uid, payload}, progress, resolve) => {
    console.log('handling',domain,action,uid,payload)
    getHandler(domain, action, tasks)
    .then(handler => handler(payload, uid, remote))
    .then(result => respond(uid, buildResponse(domain, action, result)))
    .catch(err => log('queue error', err, domain, action, uid, payload))
    .then(resolve)
  }

  return new FirebaseQueue(ref, handle)
}
