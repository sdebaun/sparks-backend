import FirebaseQueue from 'firebase-queue'

const log = (...m) => console.log(...m)

export const startDispatch = (ref, remote, tasks) => {
  const respond = (uid, result) => {
    log('responding with', result || false)
    ref.child('responses').child('uid').push(result || false)
  }

  const getHandler = (dom, act) =>
    new Promise((resolve,reject) => {
      if (!tasks[dom]) { reject(`Domain not found: ${dom}/${act}`) }
      if (!tasks[dom][act]) { reject(`Action not found: ${dom}/${act}`) }
      resolve(tasks[dom][act])
    })

  const handle = ({domain, action, uid, payload}, progress, resolve) => {
    getHandler(domain, action, tasks)
    .then(handler => handler(payload, uid, remote))
    .then(result => respond(uid, result))
    .catch(err => log('queue error', err))
    .then(resolve)
  }

  return new FirebaseQueue(ref, handle)
}
