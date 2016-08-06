import load from '../load'
import {objToRows} from '../collections'

const unsnap = s => s.val()

async function updateClientTokens() {
  const seneca = await load()
  const {fb} = await seneca.act({role:'Firebase'})

  async function getProfile(key) {
    return await fb.child('Profiles').child(key).once('value').then(unsnap)
  }
  const engagements = await fb.child('Engagements').once('value').then(unsnap).then(objToRows)
  console.log(engagements.length, 'engagements count')

  await Promise.all(
    engagements
      .filter(e => (e.priority || e.isAccepted) && !e.isConfirmed)
      .map(e =>
        seneca.act('role:gateway,cmd:generateClientToken')
        .then(({clientToken}) =>
          fb.child('Engagements').child(e.$key).update({
            paymentClientToken: clientToken,
          })
        )
      )
  )
}

updateClientTokens()
