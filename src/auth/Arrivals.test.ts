import tape from '../test/tape-seneca'
import authTest from '../test/auth'
import role from './index'

const test = tape('Auth / Arrivals', [role])
const {accepts, rejects} = authTest(test)

{
  const msg = {model:'Arrivals', role: 'Auth'}

  const msgs = [
    {cmd:'create',projectKey:'testFest',profileKey:'volunteer'},
    {cmd:'remove',key:'volunteer'},
  ]

  for (let pmsg of msgs) {
    rejects(msg, pmsg, {uid:'123'})
    rejects(msg, pmsg, {uid:'volunteer'})
    rejects(msg, pmsg, {uid:'teamLead'})
    accepts(msg, pmsg, {uid:'organizer'})
    accepts(msg, pmsg, {uid:'eap'})
    accepts(msg, pmsg, {uid:'admin'})
  }
}

