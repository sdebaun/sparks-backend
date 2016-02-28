'use strict';

var _firebase = require('firebase');

var _firebase2 = _interopRequireDefault(_firebase);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var fb = new _firebase2.default('http://sparks-development.firebaseio.com');

fb.child('tasks').push({
  domain: 'Profiles',
  action: 'confirm',
  client: 'SOMEUID',
  payload: {
    fullName: 'Bob Sagat'
  }
}, function () {
  return process.exit();
});