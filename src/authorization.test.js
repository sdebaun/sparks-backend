/* eslint-disable no-shadow */
import test from 'blue-tape'
import Authorizations, {isAdmin, isEAP, isUser} from './authorization'

let profile
let project = {
  key$: '234',
  ownerProfileKey: '123',
}
let organizers = [
  {
    projectKey: '234',
    profileKey: '345',
  },
]

const myGetStuff = models => spec => {
  return Promise.resolve({
    profile,
    project,
    organizers,
  })
}
const auths = Authorizations({}, myGetStuff)
const uid = '123'
const projectKey = '234'

test('userCanCreateProject', t => {
  const authWithProfile = p => {
    profile = p
    return auths.userCanCreateProject({uid})
  }

  t.test('no profile', t =>
    t.shouldFail(authWithProfile({})))

  t.test('not EAP or Admin', t =>
    t.shouldFail(authWithProfile({isEAP: false, isAdmin: false})))

  t.test('EAP', t =>
    authWithProfile({isEAP: true})
    .then(d => t.equal(d.profile, profile)))

  t.test('admin', t =>
    authWithProfile({isAdmin: true})
    .then(d => t.equal(d.profile, profile)))
})

test.only('userCanUpdateProject', t => {
  const authWithProfile = p => {
    profile = p
    return auths.userCanUpdateProject({uid, projectKey})
  }

  const hasData = t => ({profile, project, organizers}) => {
    t.true(profile)
    t.true(project)
    t.true(organizers)
  }

  t.test('no profile', t =>
    t.shouldFail(authWithProfile(null)))

  t.test('no access', t =>
    t.shouldFail(authWithProfile({})))

  t.test('admin', t =>
    authWithProfile({isAdmin: true})
    .then(hasData(t)))

  t.test('project owner', t =>
    authWithProfile({$key: '123'})
    .then(hasData(t)))

  t.test('project organizer', t =>
    authWithProfile({$key: '345'})
    .then(hasData(t)))
})

test('isAdmin', t => {
  t.plan(3)
  t.false(isAdmin(null))
  t.false(isAdmin({isAdmin: false}))
  t.true(isAdmin({isAdmin: true}))
})

test('isEAP', t => {
  t.plan(3)
  t.false(isEAP(null))
  t.false(isEAP({isEAP: false}))
  t.true(isEAP({isEAP: true}))
})

test('isUser', t => {
  t.plan(5)
  t.false(isUser(null, null))
  t.false(isUser(null, 3))
  t.false(isUser({}, 3))
  t.false(isUser({$key: 4}, 3))
  t.true(isUser({$key: 3}, 3))
})

