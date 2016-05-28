import Seneca from 'seneca'
import {store} from 'seneca-firebase'
import cron from 'seneca-cron'

function makeSenecaApp() {
  const seneca = Seneca()
  seneca.use('entity')
  seneca.use(store, {
    config: {
      databaseURL: 'https://sparks-jeremy-ccd3d.firebaseio.com',
      serviceAccount: 'sparks-jeremy-14deca79722c.json',
    },
    namespace: 'seneca',
    map: {'*': '*'},
  })
  seneca.use(cron)

  seneca.add({
    role: 'math',
    cmd: 'sum',
  }, (msg, respond) => {
    const sum = msg.left + msg.right
    respond(null, {answer: sum})
  })

  seneca.act('role:web', {use: {
    prefix: '/math',
    pin: 'role:math,cmd:*',
    map: {
      sum: {POST: true},
    },
  }})

  return seneca
}

function echo() {
  console.log('echooooo')
}

// seneca.act({
//   role: 'cron',
//   cmd: 'addjob',
//   time: '* * * * * *',
//   act: echo,
//   after: null,
//   timezone: null,
// }, (err, res) => {
//   console.log(err, res)
// })

export default makeSenecaApp
