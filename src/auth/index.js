import role from './role'

export default function({collections}) {
  const seneca = this
  seneca.use(role)
  console.log('auth')

//  function wrapCollection(name) {
//    return function(msg, respond) {
//      console.log('in wrap of',name,msg)
//      const prior = this.prior.bind(this)
//
//      seneca.act({...msg, role:'Auth', model: name},
//        function(err, response) {
//          if (err) { return respond(err) }
//          if (response.reject) { return respond(null, response) }
//          console.log('authentication passed for', name, msg.cmd)
//          prior({...msg, ...response}, respond)
//        }
//      )
//    }
//  }
//
//  for (let name of collections) {
//    console.log('wrapping',name)
//    seneca.wrap({role:name,cmd:'*'}, wrapCollection)
//  }

  return 'sn-auth'
}
