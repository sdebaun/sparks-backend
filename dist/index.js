'use strict';

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

var _rx = require('rx');

var _firebase = require('firebase');

var _firebase2 = _interopRequireDefault(_firebase);

var _firebaseQueue = require('firebase-queue');

var _firebaseQueue2 = _interopRequireDefault(_firebaseQueue);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var fbRoot = new _firebase2.default('http://sparks-development.firebaseio.com');

var FirebaseLookup = function FirebaseLookup(ref) {
  return _rx.Observable.create(function (obs) {
    return ref.once('value', function (snap) {
      obs.onNext(snap);obs.onCompleted();
    });
  }).map(function (snap) {
    return snap.val();
  });
};

var fbDriver = function fbDriver(ref) {

  // there are other chainable firebase query buiders, this is wot we need now
  var query = function query(parentRef, _ref) {
    var orderByChild = _ref.orderByChild;
    var equalTo = _ref.equalTo;

    var childRef = parentRef;
    if (orderByChild) {
      childRef = childRef.orderByChild(orderByChild);
    }
    if (equalTo) {
      childRef = childRef.equalTo(equalTo);
    }
    return childRef;
  };

  // used to build fb ref, each value passed is either child or k:v query def
  var chain = function chain(a, v) {
    return (typeof v === 'undefined' ? 'undefined' : _typeof(v)) === 'object' && query(a, v) || a.child(v);
  };

  // building query from fb api is simply mapping the args to chained fn calls
  var build = function build(args) {
    return FirebaseLookup(args.reduce(chain, ref));
  };

  return function () {
    for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }

    return build(args);
  };
};

var makeQueue = function makeQueue(ref) {
  var tasks$ = new _rx.Subject();

  var fbQ = new _firebaseQueue2.default(ref, function (data, progress, resolve, reject) {
    console.log('task received', data);
    tasks$.onNext(data);
    resolve();
  });

  return tasks$.share();
};

var fb = fbDriver(fbRoot);

var queue$ = makeQueue(fbRoot.child('!queue'));

var profileKey$ = queue$.flatMapLatest(function (_ref2) {
  var uid = _ref2.uid;
  return fb('Users', uid);
});

var profile$ = profileKey$.flatMapLatest(function (key) {
  return fb('Profiles', key);
});

var authedQueue$ = queue$.zip(profileKey$, profile$).map(function (_ref3) {
  var _ref4 = _slicedToArray(_ref3, 3);

  var task = _ref4[0];
  var profileKey = _ref4[1];
  var profile = _ref4[2];
  return _extends({}, task, { profileKey: profileKey, profile: profile });
}).doAction(function (x) {
  return console.log('authedQueue:', x);
});

var projects$ = authedQueue$.filter(function (_ref5) {
  var domain = _ref5.domain;
  return domain == 'Projects';
});

var create$ = projects$.filter(function (_ref6) {
  var action = _ref6.action;
  return action == 'create';
}).subscribe(function (_ref7) {
  var profile = _ref7.profile;
  var profileKey = _ref7.profileKey;
  var payload = _ref7.payload;

  console.log('new project', payload);
  fbRoot.child('Projects').push(_extends({}, payload, { ownerProfileKey: profileKey }));
});
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