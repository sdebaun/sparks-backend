import tape from 'test/tape-seneca'
import role from './index'
import authTest from 'test/auth'

const test = tape('Auth / Arrivals', [role])
const {accepts, rejects} = authTest(test)

{
  const msgs = [
    {cmd:'create',projectKey:'testFest',profileKey:'volunteer'},
    {cmd:'remove',key:'volunteer'},
  ]

  for (let pmsg of msgs) {
    const msg = {...pmsg, model:'Arrivals', role:'Auth'}
    rejects({...msg, uid:'123'})
    rejects({...msg, uid:'volunteer'})
    rejects({...msg, uid:'teamLead'})
    accepts({...msg, uid:'organizer'})
    accepts({...msg, uid:'eap'})
    accepts({...msg, uid:'admin'})
  }
}

