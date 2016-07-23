/* eslint-disable no-shadow */
import tape from 'test/tape-seneca'
import role from './role'

const test = tape('Auth', [role])

function accepts(msg, testFn = test) {
  testFn(`${msg.model} ${msg.cmd} / accepts ${msg.uid}`, async function(t) {
    const response = await this.act({role:'Auth',...msg})
    t.false(response.reject, 'it is accepted')
  })
}

function rejects(msg, testFn = test) {
  testFn(`${msg.model} ${msg.cmd} / rejects ${msg.uid}`, async function(t) {
    const response = await this.act({role:'Auth',...msg})
    t.ok(response.reject, 'it is rejected')
  })
}

test('Auth / Profiles create', async function(t) {
  const response = await this.act('role:Auth,model:Profiles,cmd:create')
  t.looseEqual({}, response)
})

{
  const msg = {model:'Profiles',cmd:'update'}
  rejects({...msg, uid:'123',key:'abc123'})
  rejects({...msg, uid:'volunteer',key:'admin'})
  accepts({...msg, uid:'volunteer',key:'volunteer'})
  accepts({...msg, uid:'admin',key:'volunteer'})
}

{
  const msg = {model:'Organizers',cmd:'accept'}
  rejects({...msg, uid:'123'})
  accepts({...msg, uid:'volunteer'})
}

{
  const msg = {model:'Organizers',cmd:'create',values:{projectKey:'testFest'}}
  rejects(msg)
  rejects({...msg, uid:'123'})
  rejects({...msg, uid:'volunteer'})
  accepts({...msg, uid:'eap'})
  accepts({...msg, uid:'organizer'})
  accepts({...msg, uid:'admin'})
}

{
  const msg = {model:'Organizers',cmd:'update',key:'organizer'}
  rejects(msg)
  rejects({...msg, uid:'123'})
  rejects({...msg, uid:'volunteer'})
  accepts({...msg, uid:'eap'})
  accepts({...msg, uid:'organizer'})
  accepts({...msg, uid:'admin'})
}

{
  const msg = {model:'Organizers',cmd:'remove',key:'organizer'}
  rejects(msg)
  rejects({...msg, uid:'123'})
  rejects({...msg, uid:'volunteer'})
  accepts({...msg, uid:'eap'})
  accepts({...msg, uid:'organizer'})
  accepts({...msg, uid:'admin'})
}

{
  const msg = {model:'Teams',cmd:'create',values:{projectKey:'testFest'}}
  rejects(msg)
  rejects({...msg, uid:'123'})
  rejects({...msg, uid:'volunteer'})
  rejects({...msg, uid:'teamLead'})
  accepts({...msg, uid:'eap'})
  accepts({...msg, uid:'organizer'})
  accepts({...msg, uid:'admin'})
}

{
  const msg = {model:'Teams',cmd:'update',key:'testTeam'}
  rejects(msg)
  rejects({...msg, uid:'123'})
  rejects({...msg, uid:'volunteer'})
  accepts({...msg, uid:'eap'})
  accepts({...msg, uid:'organizer'})
  accepts({...msg, uid:'teamLead'})
  accepts({...msg, uid:'admin'})
}

{
  const msg = {model:'Teams',cmd:'remove',key:'testTeam'}
  rejects(msg)
  rejects({...msg, uid:'123'})
  rejects({...msg, uid:'volunteer'})
  rejects({...msg, uid:'teamLead'})
  accepts({...msg, uid:'eap'})
  accepts({...msg, uid:'organizer'})
  accepts({...msg, uid:'admin'})
}

{
  const msg = {model:'TeamImages',cmd:'set',key:'testTeam'}
  rejects(msg)
  rejects({...msg, uid:'123'})
  rejects({...msg, uid:'volunteer'})
  accepts({...msg, uid:'eap'})
  accepts({...msg, uid:'organizer'})
  accepts({...msg, uid:'teamLead'})
  accepts({...msg, uid:'admin'})
}

{
  const msg = {model:'Shifts',cmd:'create',values:{teamKey:'testTeam'}}
  rejects(msg)
  rejects({...msg, uid:'123'})
  rejects({...msg, uid:'volunteer'})
  accepts({...msg, uid:'eap'})
  accepts({...msg, uid:'organizer'})
  accepts({...msg, uid:'teamLead'})
  accepts({...msg, uid:'admin'})
}

{
  const msg = {model:'Shifts',cmd:'update',key:'shiftOne'}
  rejects(msg)
  rejects({...msg, uid:'123'})
  rejects({...msg, uid:'volunteer'})
  accepts({...msg, uid:'eap'})
  accepts({...msg, uid:'organizer'})
  accepts({...msg, uid:'teamLead'})
  accepts({...msg, uid:'admin'})
}

{
  const msg = {model:'Shifts',cmd:'remove',key:'shiftOne'}
  rejects(msg)
  rejects({...msg, uid:'123'})
  rejects({...msg, uid:'volunteer'})
  accepts({...msg, uid:'eap'})
  accepts({...msg, uid:'organizer'})
  accepts({...msg, uid:'teamLead'})
  accepts({...msg, uid:'admin'})
}

{
  const msg = {model:'Projects',cmd:'create'}
  rejects(msg)
  rejects({...msg, uid:'123'})
  rejects({...msg, uid:'volunteer'})
  rejects({...msg, uid:'organizer'})
  rejects({...msg, uid:'teamLead'})
  accepts({...msg, uid:'eap'})
  accepts({...msg, uid:'admin'})
}

{
  const msg = {model:'Projects',cmd:'update',key:'testFest'}
  rejects(msg)
  rejects({...msg, uid:'123'})
  rejects({...msg, uid:'volunteer'})
  rejects({...msg, uid:'teamLead'})
  accepts({...msg, uid:'organizer'})
  accepts({...msg, uid:'eap'})
  accepts({...msg, uid:'admin'})
}

{
  const msg = {model:'Projects',cmd:'remove',key:'testFest'}
  rejects(msg)
  rejects({...msg, uid:'123'})
  rejects({...msg, uid:'volunteer'})
  rejects({...msg, uid:'teamLead'})
  rejects({...msg, uid:'organizer'})
  accepts({...msg, uid:'eap'})
  accepts({...msg, uid:'admin'})
}

{
  const msg = {model:'ProjectImages',cmd:'set',key:'testFest'}
  rejects(msg)
  rejects({...msg, uid:'123'})
  rejects({...msg, uid:'volunteer'})
  rejects({...msg, uid:'teamLead'})
  accepts({...msg, uid:'organizer'})
  accepts({...msg, uid:'eap'})
  accepts({...msg, uid:'admin'})
}

{
  const msgs = [
    {cmd:'create',values:{projectKey:'testFest',profileKey:'volunteer'}},
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
