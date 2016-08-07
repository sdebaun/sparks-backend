import * as assert from 'assert'
import {
  all, allPass, anyPass, apply, compose, contains, equals, juxt, map, path,
  pathOr, prop, propOr, merge,
} from 'ramda'

export const isAdmin = propOr(false, 'isAdmin')

export const isEAP = propOr(false, 'isEAP')

export const isUser = (profile, key) => profile && profile.$key === key

type ObjectRule = (Object) => boolean

// Rules
const profileIsAdmin = pathOr<boolean>(false, ['profile', 'isAdmin'])
const profileIsEAP = pathOr<boolean>(false, ['profile', 'isEAP'])
function profileIsObjectOwner(model:string):ObjectRule {
  return compose<Object, Array<string>, boolean>(
    allPass([
      all(Boolean),
      apply<any, any>(equals)
    ]),
    juxt<any, string>([
      pathOr(false, ['profile', '$key']),
      pathOr(false, [model, 'ownerProfileKey']),
    ])
  )
}
const profileIsProjectOwner:ObjectRule = profileIsObjectOwner('project')
const profileIsOppOwner:ObjectRule = profileIsObjectOwner('opp')
const profileIsTeamOwner:ObjectRule = profileIsObjectOwner('team')

const profileIsActiveOrganizer = compose<Object, Object[], boolean>(
    apply<Object[], boolean>(contains),
    juxt<Object, Object[]>([
      path(['profile', '$key']),
      compose<Object, any, string[]>(
        map<Object, string>(prop('profileKey')),
        prop('organizers')
      ),
    ])
  )

const profileAndProject:ObjectRule = allPass([
  prop('profile'),
  prop('project'),
])

const createProjectRules:ObjectRule = anyPass([
  profileIsAdmin,
  profileIsEAP,
])

const updateProjectRules:ObjectRule = allPass([
  profileAndProject,
  anyPass([
    profileIsAdmin,
    profileIsProjectOwner,
    profileIsActiveOrganizer,
  ]),
])

const removeProjectRules:ObjectRule = allPass([
  profileAndProject,
  anyPass([
    profileIsAdmin,
    profileIsProjectOwner,
  ]),
])

const updateTeamRules:ObjectRule = anyPass([profileIsTeamOwner, updateProjectRules])
const updateOppRules:ObjectRule = anyPass([profileIsOppOwner, updateProjectRules])

function pass(ruleFn:ObjectRule, rejectionMsg:string, respond) {
  if (typeof respond === 'object') {
    if (ruleFn(respond)) {
      return respond
    } else {
      return {reject: rejectionMsg}
    }
  } else {
    return function(obj) {
      if (ruleFn(obj)) {
        console.log('respond with', obj)
        respond(null, obj)
      } else {
        console.log('reject with', rejectionMsg)
        respond(null, {reject: rejectionMsg})
      }
    }
  }
}

/**
* Each of the actions defined here is an authorization function. If the action
* is allowed then it returns a blank object, or an object with some records to
* avoid double lookups.
*
* If the action is rejected then it will return an object with the key reject
* containing the reason.
*
* There is a try/catch wrapper at the bottom of this block that will convert
* any thrown errors into a reject message.
*/
export default function() {
  const seneca = this
  const add = seneca.add.bind(seneca)
  const get = spec => this.act('role:Firebase,cmd:get', spec)

  // TODO: by default we allow anything?
  add({role:'Auth',default$:true}, async function (msg) {
    return await this.act({role:'Firebase',cmd:'get',profile:{uid: msg.uid}})
  })

  // Projects
  add({role:'Auth',cmd:'create',model:'Projects'}, async function({uid}) {
    const {profile} = await this.act({role:'Firebase',cmd:'get',profile:{uid}})

    return pass(
      createProjectRules,
      'User cannot create project',
      {profile, userRole: 'project'}
    )
  })

  add({role:'Auth',cmd:'update',model:'Projects'}, async function({uid, key}) {
    const objects = await this.act({role:'Firebase',cmd:'get',
      profile: {uid},
      project: key,
      organizers: {projectKey: key},
    })

    return pass(
      updateProjectRules,
      'User cannot update project',
      merge(objects, {userRole: 'project'})
    )
  })

  add({role:'Auth',cmd:'remove',model:'Projects'}, async function({uid, key}) {
    const objects = await this.act({role:'Firebase',cmd:'get',
      profile: {uid},
      project: key,
    })

    return pass(
      removeProjectRules,
      'User cannot remove project',
      merge(objects, {userRole: 'project'})
    )
  })

  // ProjectImages
  add({role:'Auth',model:'ProjectImages'}, async function({uid, key}) {
    return await this.act('role:Auth,model:Projects,cmd:update', {uid, key})
  })

  // Teams
  add({role:'Auth',cmd:'remove',model:'Teams'}, async function({uid, key}) {
    const {team} = await this.act({role:'Firebase',cmd:'get',team: key})
    assert(team, `Team ${key} not found`)
    return await this.act('role:Auth,model:Projects,cmd:update', {uid, key: team.projectKey})
  })

  add({role:'Auth',cmd:'update',model:'Teams'}, async function({uid, key}) {
    const {profile, team, project, organizers} = await this.act({role:'Firebase',cmd:'get',
      profile: {uid},
      team: key,
      project: ['team', 'projectKey'],
      organizers: {projectKey: ['team', 'projectKey']},
    })

    assert(team, `Team ${key} not found`)
    assert(project, 'Project not found')

    return pass(
      updateTeamRules,
      'User cannot update team',
      {profile, team, project, organizers}
    )
  })

  add({role:'Auth',cmd:'create',model:'Teams'}, async function(msg) {
    return await this.act(merge(
      msg,
      {
        model:'Projects',
        cmd:'update',
        key: msg.values.projectKey,
      }
    ))
  })

  // TeamImages
  add({role:'Auth',model:'TeamImages'}, async function(msg) {
    return await this.act(merge(msg, {role:'Auth',model:'Teams',cmd:'update',key:msg.key}))
  })

  add('role:Auth,cmd:create,model:Opps', async function({uid, values}) {
    return await this.act('role:Auth,cmd:update,model:Projects', {uid, key: values.projectKey})
  })

  // Opps
  add({role:'Auth',model:'Opps'}, async function({uid, key, oppKey}) {
    const {profile, opp, project, organizers} = await this.act({role:'Firebase',cmd:'get',
      profile: {uid},
      opp: oppKey || key,
      project: ['opp', 'projectKey'],
      organizers: {projectKey: ['opp', 'projectKey']},
    })

    assert(opp, 'Opp not found')
    assert(project, 'Project not found')

    return pass(
      updateOppRules,
      'User cannot update opp',
      {profile, opp, project, organizers}
    )
  })

  // Shifts
  add({role:'Auth',model:'Shifts'}, async function(msg) {
    if (contains(msg.cmd, ['update', 'remove'])) {
      const {shift} = await this.act({role:'Firebase',cmd:'get',shift:msg.key})
      return await this.act(merge(
        msg,
        {
          role:'Auth',
          cmd:'update',
          model:'Teams',
          key:shift.teamKey,
        }
      ))
    } else {
      return await this.prior(msg)
    }
  })

  add({role:'Auth',cmd:'create',model:'Shifts'}, async function(msg) {
    return await this.act(merge(
      msg,
      {
        role:'Auth',
        cmd:'update',
        model:'Teams',
        key:msg.values.teamKey,
      }
    ))
  })

  // Organizers
  add({role:'Auth',model:'Organizers'}, async function(msg) {
    const {organizer} = await this.act({role:'Firebase',cmd:'get',organizer:msg.key})

    return await this.act(merge(
      msg,
      {
        model:'Projects',
        cmd:'update',
        key: organizer.projectKey,
      }
    ))
  })

  add({role:'Auth',model:'Organizers',cmd:'create'}, async function(msg) {
    return await this.act(merge(
      msg,
      {
        model:'Projects',
        cmd:'update',
        key: msg.values.projectKey,
      }
    ))
  })

  add({role:'Auth',model:'Organizers',cmd:'accept'}, async function({uid}) {
    const data = await this.act({role:'Firebase',cmd:'get',profile:{uid}})
    return pass(prop('profile'), 'Must have a profile', data)
  })

  // Profiles
  add({role:'Auth', model:'Profiles', cmd:'update'}, async function({uid, key}):Promise<AuthResponse> {
      const {profile: myProfile} = await get({profile: {uid}})
      const {profile} = await get({profile: key})

      if (myProfile && profile && (myProfile.isAdmin || profile.uid === uid)) {
        return {isAdmin: Boolean(myProfile.isAdmin), profile}
      } else {
        return {reject: 'Cannot update profile of another user'}
      }
    }
  )

  add({role:'Auth', model:'Profiles', cmd:'create'}, async function() {
    // Anyone can create a profile
    return {}
  })

  // Commitments
  add({role:'Auth', model:'Commitments'}, async function({uid, key}) {
    const {opp} = await this.act('role:Firebase,cmd:get', {
      commitment: key,
      opp: ['commitment', 'oppKey'],
    })

    return await this.act('role:Auth,model:Projects,cmd:update', {uid, key: opp.projectKey})
  })

  add({role:'Auth', model:'Commitments', cmd:'create'}, async function({uid, values: {oppKey}}) {
    const {opp} = await this.act('role:Firebase,cmd:get', {opp: oppKey})
    return await this.act('role:Auth,model:Projects,cmd:update', {uid, key: opp.projectKey})
  })

  // Fulfillers
  add('role:Auth,model:Fulfillers', async function({uid, key, values}) {
    const oppKey =
      key ?
        (await this.act('role:Firebase,cmd:get', {fulfiller: key})).fulfiller.key :
        values.oppKey

    return await this.act('role:Auth,model:Opp,cmd:update', {uid, key: oppKey})
  })

  // Assignments
  add('role:Auth,model:Assignments,cmd:create', async function({uid, values}) {
    const {profile, opp} = await this.act('role:Firebase,cmd:get', {
      profile: {uid},
      opp: values.oppKey,
    })

    assert(profile, 'Profile not found')
    assert(opp, 'Opp not found')

    if (profile.$key === values.profileKey) {
      return {profile}
    } else {
      return await this.act('role:Auth,model:Projects,cmd:update', {uid, key: opp.projectKey})
    }
  })

  add('role:Auth,model:Assignments', async function({uid, key}) {
    const {profile, assignment, opp} = await this.act('role:Firebase,cmd:get', {
      profile: {uid},
      assignment: key,
      opp: ['assignment', 'oppKey'],
    })

    if (profile.$key === assignment.profileKey) {
      return {profile}
    } else {
      return await this.act('role:Auth,model:Projects,cmd:update', {uid, key: opp.projectKey})
    }
  })

  // Memberships
  add('role:Auth,model:Memberships', async function({uid, key}) {
    const {membership} = await this.act('role:Firebase,cmd:get', {membership: key})
    assert(membership, 'Membership not found')
    return await this.act('role:Auth,model:Engagements,cmd:update', {uid, key: membership.engagementKey})
  })

  add('role:Auth,model:Memberships,cmd:create', async function({uid, values}) {
    const {profile, engagement, opp} = await this.act('role:Firebase,cmd:get', {
      profile: {uid},
      engagement: values.engagementKey,
      opp: ['engagement', 'oppKey'],
    })

    assert(profile, 'Profile not found')
    assert(engagement, 'Engagement not found')

    if (profile.$key === engagement.profileKey) {
      return {profile, engagement, userRole: 'volunteer'}
    } else {
      return await this.act('role:Auth,model:Projects,cmd:update', {uid, key: opp.projectKey})
    }
  })

  return 'roles-sn'
}
