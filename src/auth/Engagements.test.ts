import tape from 'test/tape-seneca'
import role from './index'
import authTest from 'test/auth'

const test = tape('Auth / Engagements', [role])
const {accepts, rejects} = authTest(test)

{
  const msg = {model:'Engagements',cmd:'create',key:'volunteer',values:{oppKey: 'oppOne', profileKey: 'volunteer'}}

  rejects(msg)
  rejects({...msg, uid:'123'})
  rejects({...msg, uid:'teamLead'})
  rejects({...msg, uid:'volTwo'})
  accepts({...msg, uid:'volunteer'})
  rejects({...msg, uid:'organizer'})
  rejects({...msg, uid:'eap'})
  accepts({...msg, uid:'admin'})
}

{
  const msg = {model:'Engagements',cmd:'update',key:'volunteer'}

  rejects(msg)
  rejects({...msg, uid:'123'})
  rejects({...msg, uid:'teamLead'})
  rejects({...msg, uid:'volTwo'})
  accepts({...msg, uid:'volunteer'})
  accepts({...msg, uid:'organizer'})
  accepts({...msg, uid:'eap'})
  accepts({...msg, uid:'admin'})

  test('update / sets volunteer role', async function(t) {
    const response = await this.act({role:'Auth',...msg,uid:'volunteer'})
    t.equal(response.userRole, 'volunteer')
  })

  test('update / sets project role', async function(t) {
    const eap = await this.act({role:'Auth',...msg,uid:'eap'})
    t.equal(eap.userRole, 'project')

    const organizer = await this.act({role:'Auth',...msg,uid:'organizer'})
    t.equal(organizer.userRole, 'project')

    const admin = await this.act({role:'Auth',...msg,uid:'admin'})
    t.equal(admin.userRole, 'project')
  })
}

{
  const msg = {model:'Engagements',key:'volunteer'}

  for (let cmd of ['confirmWithoutPay', 'pay']) {
    msg.cmd = cmd

    rejects(msg)
    rejects({...msg, uid:'123'})
    rejects({...msg, uid:'teamLead'})
    rejects({...msg, uid:'volTwo'})
    rejects({...msg, uid:'eap'})
    rejects({...msg, uid:'organizer'})
    accepts({...msg, uid:'volunteer'})
    accepts({...msg, uid:'admin'})
  }
}

