import Firebase from 'firebase'
import {Observable} from 'rx'
import {makeQueue, makeOnce} from './firebase-streams'

const fb = new Firebase('http://sparks-development.firebaseio.com')

const {queue$, respond} = makeQueue(fb.child('!queue'))

const once = makeOnce(fb)

const profileKey$ = queue$.flatMapLatest(({uid}) => once('Users',uid))

const profile$ = profileKey$.flatMapLatest(key => key && once('Profiles',key) || Observable.just(null))

const authedQueue$ = queue$
  .zip(profileKey$, profile$)
  .map(([task, profileKey, profile]) => ({...task, profileKey, profile}))
  .doAction(x => console.log('authedQueue:',x))

const projects$ = authedQueue$
  .filter(({domain}) => domain == 'Projects')

const createProject$ = projects$
  .filter(({action}) => action == 'create')
  .subscribe(({uid,profile,profileKey,payload}) => {
    console.log('new project',payload)
    const ref = fb.child('Projects').push({...payload,ownerProfileKey:profileKey})
    respond(uid,{domain:'Projects', event:'create', payload:ref.key()})
  })

const organizers$ = authedQueue$
  .filter(({domain}) => domain == 'Organizers')

const createOrganizer$ = organizers$
  .filter(({action}) => action == 'create')
  .subscribe(({uid,profile,profileKey,payload}) => {
    console.log('create organizer',payload)
    const ref = fb.child('Organizers').push({...payload,authorProfileKey:profileKey})
    respond(uid,{domain:'Organizers', event:'create', payload:ref.key()})
  })

const teams$ = authedQueue$
  .filter(({domain}) => domain == 'Teams')

const createTeam$ = teams$
  .filter(({action}) => action == 'create')
  .subscribe(({uid,profile,profileKey,payload}) => {
    console.log('create team',payload)
    const ref = fb.child('Teams').push({...payload,authorProfileKey:profileKey})
    respond(uid,{domain:'Teams', event:'create', payload:ref.key()})
  })

const profiles$ = authedQueue$
  .filter(({domain}) => domain == 'Profiles')

const createProfile$ = profiles$
  .filter(({action}) => action == 'create')
  .subscribe(({uid,profile,profileKey,payload}) => {
    console.log('create profile',payload)
    const obj = {
      ...payload,
      uid,
      isAdmin: false,
      isConfirmed: true,
    }

    const ref = fb.child('Profiles').push(obj)

    const userRef = fb.child('Users').child(uid).set(ref.key())
    
    respond(uid,{domain:'Profiles', event:'create', payload:ref.key()})
  })

const opps$ = authedQueue$
  .filter(({domain}) => domain == 'Opportunities')

const createOpp$ = opps$
  .filter(({action}) => action == 'create')
  .subscribe(({uid,profile,profileKey,payload}) => {
    console.log('create opp',payload)
    const ref = fb.child('Opportunities').push({...payload,authorProfileKey:profileKey})
    respond(uid,{domain:'Opps', event:'create', payload:ref.key()})
  })


// export class FirebaseRespondingQueue {
//   constructor(ref,handle,respond) {
//     this.queue = new FirebaseQueue(ref, (data,progress,resolve,reject)=>{
//       handle(data)
//       .then( (result)=>result && respond(data.client,result) )
//       .then( resolve )
//       .catch( (err)=>{
//         console.log('Error in queue handler:',err,err.stack)
//         reject(err)
//       } )
//     })
//   }
// }


// import Firebase from 'firebase'
// import { mutator, Collection, FirebaseRespondingQueue, createProfileFromOauth } from './util'

// const fbRoot = new Firebase('http://sparks-development.firebaseio.com')

// const getAuth = (client)=>
//   Users.get(client)
//   .then( (userSnap)=>
//     userSnap.val() && Profiles.get(userSnap.val())
//     // should also add organizers, leads, etc. (relationships)
//     .then( (profileSnap)=>{ return {key:userSnap.val(),...profileSnap.val()} } )
//   )

// const Users = new Collection(fbRoot.child('Users'))
// const Profiles = new Collection(fbRoot.child('Profiles'))

// const Projects = new Collection(fbRoot.child('Projects'))
// const ProjectImages = new Collection(fbRoot.child('ProjectImages'))
// const Organizers = new Collection(fbRoot.child('Organizers'))

// const Teams = new Collection(fbRoot.child('Teams'))
// const TeamImages = new Collection(fbRoot.child('TeamImages'))
// const Leads = new Collection(fbRoot.child('Leads'))

// const Opps = new Collection(fbRoot.child('Opps'))
// const Offers = new Collection(fbRoot.child('Offers'))
// const Fulfillers = new Collection(fbRoot.child('Fulfillers'))

// const handlers = {

//   Profiles: {
//     register: (payload,client)=>
//       getAuth(client).then( profile=> !profile &&
//         Profiles.push(createProfileFromOauth(payload))
//         .then( ref=>Users.set(client,ref.key()) && ref.key() )
//       ),
//     confirm: ({key,vals},client)=>
//       getAuth(client).then( profile=> (profile.key==key) &&
//         Profiles.update(key,{isConfirmed:true,...vals}) &&
//         null
//       )
//   },

//   Projects: {
//     create: (payload,client)=>
//       getAuth(client).then( profile=> profile.isAdmin &&
//         Projects.push(payload)
//         .then( ref=>ref.key() )
//       ),
//     update: ({key,vals},client)=>
//       Projects.update(key,vals).then( ()=>{ // auth check if project manager
//         Organizers.updateBy('projectKey',key,{project:vals})
//         Teams.updateBy('projectKey',key,{project:vals})
//         Opps.updateBy('projectKey',key,{project:vals})
//         Leads.updateBy('projectKey',key,{project:vals})
//         return true
//       })
//   },

//   Organizers: {
//     create: (payload,client)=> // auth check if project manager
//       Projects.get(payload.projectKey).then( (snap)=>
//         Organizers.push(Object.assign(payload,{project:snap.val()}))
//         .then( ref=>ref.key() )
//       ),
//     accept: ({organizerKey},client)=>
//       getAuth(client).then( profile=>
//         Organizers.update(organizerKey,{profileKey:profile.key,profile})
//         .then( ()=>
//           Organizers.get(organizerKey)
//           .then( organizerSnap=>organizerSnap.val().projectKey )
//         )
//       )    
//   },

//   ProjectImages: {
//     set: ({key,val},client)=>
//       ProjectImages.set(key,val) // auth check if project manager
//   },

//   Teams: {
//     create: (payload,client)=> // auth check if project manager
//       Projects.get(payload.projectKey)
//       .then( projectSnap=>
//         Teams.push({...payload,project:projectSnap.val()})
//         .then( ref=>ref.key() )
//       ), 
//     update: ({key,vals},client)=>
//       Teams.update(key,vals).then( ()=>{ // auth check if project manager
//         Leads.updateBy('teamKey',key,{team:vals})
//         return true
//       })
//   },

//   TeamImages: {
//     set: ({key,val},client)=>
//       TeamImages.set(key,val) // auth check if project manager or team lead
//   },

//   Leads: {
//     create: (payload,client)=>
//       Teams.get(payload.teamKey)
//       .then( teamSnap=> {
//         const {project,...team} = teamSnap.val(),
//           projectKey = team.projectKey
//         Leads.push({...payload,team,projectKey,project})
//         .then( ref=>ref.key() ) // auth check if project manager        
//       }),
//     accept: ({leadKey},client)=>
//       getAuth(client).then( profile=>
//         Leads.update(leadKey,{profileKey:profile.key,profile}) // get profileKey from auth object
//       )
//   },

//   Opps: {
//     create: (payload,client)=> // auth check if project manager
//       Projects.get(payload.projectKey)
//       .then( projectSnap=>
//         Opps.push({...payload,project:projectSnap.val()})
//         .then( ref=>ref.key() )
//       ), 
//     update: ({key,vals},client)=> // auth check if project manager or team lead
//       Opps.update(key,vals).then( ()=>{
//         Offers.updateBy('oppKey',key,{opp:vals})
//         return true
//       }), 
//     setPublic: ({key,val})=> // auth check if project manager or team lead
//       Opps.update(key,{isPublic:!!val}),
//     setOpen: ({key,val})=> // auth check if project manager or team lead
//       Opps.update(key,{isOpen:!!val})
//   },

//   Offers: {
//     create: (payload,client)=>
//       Opps.get(payload.oppKey)
//       .then( oppSnap=>
//         Offers.push({...payload,opp:oppSnap.val()})
//         .then( ref=>ref.key() )
//         ),
//     remove: (payload,client)=>
//       Offers.remove(payload.key).then( ()=>true ),
//     update: ({key,vals},client)=>
//       Offers.update(key,vals)
//   },

//   Fulfillers: {
//     create: (payload,client)=>
//       Promise.all([
//         Teams.get(payload.teamKey),
//         Opps.get(payload.oppKey)
//       ])
//       .then( ([teamSnap,oppSnap])=>
//         Fulfillers.push({...payload,team:teamSnap.val(),opp:oppSnap.val()})
//       )
//       .then( ref=>ref.key() ),
//     remove: (payload,client)=>
//       Fulfillers.remove(payload.key).then( ()=>true ),
//     update: ({key,vals},client)=>
//       Fulfillers.update(key,vals)
//   }

// }

// const responder = (client,response)=>fbRoot.child('Responses').child(client).push(response)

// const queue = new FirebaseRespondingQueue(fbRoot, mutator(handlers), responder)


// ---

// import FirebaseQueue from 'firebase-queue'

// const handlerNotFound = collection => (payload,client) =>
//   new Promise( (resolve,reject)=>{
//     console.log('Could not find handler for collection', collection)
//     resolve()
//   })
  
// export const mutator = handlers => ({client,collection,op,payload}) => {
//   console.log('received',client,collection,op)
//   const handler = (handlers[collection] && handlers[collection][op]) || handlerNotFound(collection)
//   return handler(payload,client)
//     .then( (result)=>result && {collection,op,result} )
// }

// export class Collection {
//   constructor(ref) { this.ref = ref }

//   child(key) { return this.ref.child(key) }
//   push(payload) { return this.ref.push(payload) }
//   set(key,val) { return this.ref.child(key).set(val) }
//   update(key,vals) { return this.ref.child(key).update(vals) }
//   get(key) { return this.ref.child(key).once('value') }
//   remove(key) { return this.ref.child(key).remove() }
//   updateBy(field,key,vals) {
//     return this.ref.orderByChild(field).equalTo(key).once('value').then( (snap)=>{
//       console.log('updating from',key,'with',vals)
//       const childs = snap.val()
//       console.log('childs',childs)
//       Object.keys(snap.val()).map( (childKey)=> this.update(childKey,vals) )
//       return true
//     })
//   }
// }

// export class FirebaseRespondingQueue {
//   constructor(ref,handle,respond) {
//     this.queue = new FirebaseQueue(ref, (data,progress,resolve,reject)=>{
//       handle(data)
//       .then( (result)=>result && respond(data.client,result) )
//       .then( resolve )
//       .catch( (err)=>{
//         console.log('Error in queue handler:',err,err.stack)
//         reject(err)
//       } )
//     })
//   }
// }

// export const createProfileFromOauth = authData => {
//   const provider = authData.provider,
//     d = authData[provider];
//   switch (provider) {
//     case 'google':
//       return {
//         uid: authData.uid,
//         fullName: d.displayName,
//         email: d.email,
//         profileImageURL: d.profileImageURL
//       }
//     case 'facebook':
//       return {
//         uid: authData.uid,
//         fullName: 'FB Full name',
//         email: 'FB email',
//         profileImageURL: 'FB image url'
//       }
//     default:
//       throw 'Can only handle google or facebook oauth.'
//   }
// }



//   // constructor(ref,ops) {
//   //   const actions = {
//   //     push: payload=>ref.push(payload),
//   //     set: (key,val)=>ref.child(key).set(val),
//   //     update: (key,vals)=>ref.child(key).update(vals),
//   //     response: (op,payload)=>{ return {collection:ref.key(),op,payload} }      
//   //   }
//   //   for (let k of Object.keys(ops)) {
//   //     this[k] = partialRight(ops[k],[actions]).bind(this)
//   //   }
//   // }
