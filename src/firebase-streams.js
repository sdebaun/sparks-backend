import {Observable,Subject} from 'rx'
import Firebase from 'firebase'
import FirebaseQueue from 'firebase-queue'

const FirebaseOnce = (ref) =>
  Observable.create(obs => ref.once('value', (snap) => {obs.onNext(snap); obs.onCompleted()}))
    .map(snap => snap.val())

export const makeOnce = ref => {
  // there are other chainable firebase query buiders, this is wot we need now
  const query = (parentRef,{orderByChild,equalTo}) => {
    let childRef = parentRef
    if (orderByChild) { childRef = childRef.orderByChild(orderByChild) }
    if (equalTo) { childRef = childRef.equalTo(equalTo) }
    return childRef
  }

  // used to build fb ref, each value passed is either child or k:v query def
  const chain = (a,v) => typeof v === 'object' && query(a,v) || a.child(v)

  // building query from fb api is simply mapping the args to chained fn calls
  return (...args) => FirebaseOnce(args.reduce(chain,ref))
}

export const makeQueue = (ref, responses = 'responses') => {
  const tasks$ = new Subject()
  const responseRef = ref.child(responses)

  const fbQ = new FirebaseQueue(ref, (data,progress,resolve,reject) => {
    console.log('task received',data)
    tasks$.onNext(data)
    resolve()
  })

  return {
    queue$: tasks$.share(),
    respond: (uid,response) => responseRef.child(uid).push(response)
  }
}
