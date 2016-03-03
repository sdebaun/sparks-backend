'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.makeQueue = exports.makeOnce = undefined;

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

var _rx = require('rx');

var _firebase = require('firebase');

var _firebase2 = _interopRequireDefault(_firebase);

var _firebaseQueue = require('firebase-queue');

var _firebaseQueue2 = _interopRequireDefault(_firebaseQueue);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var FirebaseOnce = function FirebaseOnce(ref) {
  return _rx.Observable.create(function (obs) {
    return ref.once('value', function (snap) {
      obs.onNext(snap);obs.onCompleted();
    });
  }).map(function (snap) {
    return snap.val();
  });
};

var makeOnce = exports.makeOnce = function makeOnce(ref) {
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
  return function () {
    for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }

    return FirebaseOnce(args.reduce(chain, ref));
  };
};

var makeQueue = exports.makeQueue = function makeQueue(ref) {
  var responses = arguments.length <= 1 || arguments[1] === undefined ? 'responses' : arguments[1];

  var tasks$ = new _rx.Subject();
  var responseRef = ref.child(responses);

  var fbQ = new _firebaseQueue2.default(ref, function (data, progress, resolve, reject) {
    console.log('task received', data);
    tasks$.onNext(data);
    resolve();
  });

  return {
    queue$: tasks$.share(),
    respond: function respond(uid, response) {
      return responseRef.child(uid).push(response);
    }
  };
};