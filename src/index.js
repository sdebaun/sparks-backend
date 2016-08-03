import express from 'express'
import senecaSn from './seneca-sn'
import Seneca from 'seneca-await'
import {startDispatch} from './dispatch'
import cfg from './cfg'

const app = express()

app.get('/', (req,res) => res.send('Hello World!'))
app.listen(cfg.PORT, () => console.log('Listening on ',cfg.PORT))

const seneca = Seneca({
  // Don't crash it when an error occurs
  debug: {
    undead: true,
  },
  // IF we do not set this then we'd have to rewrite the firebase tasks to wrap
  // the return in an object key/pair
  strict:{result:false},
})

seneca.use(senecaSn, {cfg})

seneca.ready()
  .then(function() {
    seneca.act({role:'Firebase'})
      .then(function({fb}) {
        console.log('Starting dispatch')
        startDispatch(fb.child('!queue'), seneca)
      })
  })
