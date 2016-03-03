'use strict';

var _firebase = require('firebase');

var _firebase2 = _interopRequireDefault(_firebase);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var fb = new _firebase2.default('http://sparks-development.firebaseio.com');

fb.child('!queue/tasks').push({
  domain: 'Projects',
  action: 'create',
  uid: 'google:115393618569155529188', // my google uid
  payload: {
    name: 'SagatFest'
  }
}, function () {
  return process.exit();
});