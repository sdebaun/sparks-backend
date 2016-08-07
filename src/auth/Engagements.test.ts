import tape from '../test/tape-seneca'
import authTest from '../test/auth'
import role from './index'

const test = tape('Auth / Engagements', [role])
const {accepts, rejects} = authTest(test)

{
  const msg = {model:'Engagements',cmd:'create',key:'volunteer',values:{oppKey: 'oppOne', profileKey: 'volunteer'}}

  rejects(msg)
  rejects(msg, {uid:'123'})
  rejects(msg, {uid:'teamLead'})
  rejects(msg, {uid:'volTwo'})
  accepts(msg, {uid:'volunteer'})
  rejects(msg, {uid:'organizer'})
  rejects(msg, {uid:'eap'})
  accepts(msg, {uid:'admin'})
}

{
  const msg = {model:'Engagements',cmd:'update',key:'volunteer'}

  rejects(msg)
  rejects(msg, {uid:'123'})
  rejects(msg, {uid:'teamLead'})
  rejects(msg, {uid:'volTwo'})
  accepts(msg, {uid:'volunteer'})
  accepts(msg, {uid:'organizer'})
  accepts(msg, {uid:'eap'})
  accepts(msg, {uid:'admin'})

  test('update / sets volunteer role', async function(t) {
    const response = await this.act('role:Auth,uid:volunteer', msg)
    t.equal(response.userRole, 'volunteer')
  })

  test('update / sets project role', async function(t) {
    const eap = await this.act('role:Auth,uid:eap', msg)
    t.equal(eap.userRole, 'project')

    const organizer = await this.act('role:Auth,uid:organizer', msg)
    t.equal(organizer.userRole, 'project')

    const admin = await this.act('role:Auth,uid:admin', msg)
    t.equal(admin.userRole, 'project')
  })
}

{
  const msg = {model:'Engagements',key:'volunteer'}

  for (let cmd of ['confirmWithoutPay', 'pay']) {
    rejects(msg, {cmd})
    rejects(msg, {cmd, uid:'123'})
    rejects(msg, {cmd, uid:'teamLead'})
    rejects(msg, {cmd, uid:'volTwo'})
    rejects(msg, {cmd, uid:'eap'})
    rejects(msg, {cmd, uid:'organizer'})
    accepts(msg, {cmd, uid:'volunteer'})
    accepts(msg, {cmd, uid:'admin'})
  }
}

