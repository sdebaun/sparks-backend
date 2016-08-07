import load from '../load'
import {objToRows} from '../collections'

async function migrate() {
  const seneca = await load()
  const {fb} = await seneca.act({role:'Firebase'})

  console.log('Loading engagements')
  const engagements = await fb.child('Engagements').once('value').then(s => s.val())

  const isitworking = await engagements.map(async function(engagement) {
    return 'hello'
  })

  console.log(isitworking)
  seneca.close(() => process.exit())
}

migrate()
