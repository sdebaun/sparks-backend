import assert from 'assert'
import Promise from 'bluebird'
import {
  all, allPass, anyPass, apply, compose, contains, equals, juxt, map, path,
  pathOr, prop, propOr,
} from 'ramda'

export const isAdmin = propOr(false, 'isAdmin')

export const isEAP = propOr(false, 'isEAP')

export const isUser = (profile, key) => profile && profile.$key === key

// Rules
const profileIsAdmin = pathOr(false, ['profile', 'isAdmin'])
const profileIsEAP = pathOr(false, ['profile', 'isEAP'])
const profileIsObjectOwner = model =>
  compose(
    allPass([all(Boolean), apply(equals)]),
    juxt([
      pathOr(false, ['profile', '$key']),
      pathOr(false, [model, 'ownerProfileKey']),
    ])
  )
const profileIsProjectOwner = profileIsObjectOwner('project')
const profileIsOppOwner = profileIsObjectOwner('opp')
const profileIsTeamOwner = profileIsObjectOwner('team')

const profileIsActiveOrganizer = compose(
    apply(contains),
    juxt([
      path(['profile', '$key']),
      compose(
        map(prop('profileKey')),
        prop('organizers')
      ),
    ])
  )

const profileAndProject = allPass([
  prop('profile'),
  prop('project'),
])

const createProjectRules = anyPass([
  profileIsAdmin,
  profileIsEAP,
])

const updateProjectRules = allPass([
  profileAndProject,
  anyPass([
    profileIsAdmin,
    profileIsProjectOwner,
    profileIsActiveOrganizer,
  ]),
])

const removeProjectRules = allPass([
  profileAndProject,
  anyPass([
    profileIsAdmin,
    profileIsProjectOwner,
  ]),
])

const updateTeamRules = anyPass([profileIsTeamOwner, updateProjectRules])
const updateOppRules = anyPass([profileIsOppOwner, updateProjectRules])

function pass(ruleFn, rejectionMsg, respond) {
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

export default function() {
  const seneca = this
  const add = seneca.add.bind(seneca)

  add({role:'Auth'}, async function (msg) {
    return await this.act({role:'Firebase',cmd:'get',profile:{uid: msg.uid}})
  })

  add({role:'Auth',cmd:'create',model:'Projects'}, async function({uid}) {
    const {profile} = await this.act({role:'Firebase',cmd:'get',profile:{uid}})

    return pass(
      createProjectRules,
      'User cannot create project',
      {profile}
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
      objects
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
      objects
    )
  })

  add({role:'Auth',cmd:'remove',model:'Teams'}, async function({uid, key}) {
    const {team} = await this.act({role:'Firebase',cmd:'get',team: key})
    assert(team, `Team ${key} not found`)
    return await this.act('role:Auth,model:Projects,cmd:update', {uid, key: team.projectKey})
  })

  add({role:'Auth',cmd:'update',model:'Teams'}, async function({uid, key}) {
    const {profile, team} = await this.act({role:'Firebase',cmd:'get',
      profile: {uid},
      team: key,
    })

    assert(team, `Team ${key} not found`)

    const {project, organizers} = await this.act({role:'Firebase',cmd:'get',
      project: team.projectKey,
      organizers: {projectKey: team.projectKey},
    })

    return pass(
      updateTeamRules,
      'User cannot update team',
      {profile, team, project, organizers}
    )
  })

  add({role:'Auth',cmd:'create',model:'Teams'}, async function(msg) {
    return await this.act({
      ...msg,
      model:'Projects',
      cmd:'update',
      key: msg.values.projectKey,
    })
  })

  add({role:'Auth',model:'TeamImages'}, async function(msg) {
    return await this.act({...msg, role:'Auth',model:'Teams',cmd:'update',key:msg.key})
  })

  add({role:'Auth',cmd:'update',model:'Opps'}, async function({uid, key, oppKey}) {
    const {profile, opp} = await this.act({role:'Firebase',cmd:'get',
      profile: {uid},
      opp: oppKey || key,
    })
    const {project, organizers} = this.act({role:'Firebase',cmd:'get',
      project: opp.projectKey,
      organizers: {projectKey: opp.projectKey},
    })

    return pass(
      updateOppRules,
      'User cannot update opp',
      {profile, opp, project, organizers}
    )
  })

  add({role:'Auth',model:'Shifts'}, async function(msg) {
    if (contains(msg.cmd, ['update', 'remove'])) {
      const {shift} = await this.act({role:'Firebase',cmd:'get',shift:msg.key})
      return await this.act({
        ...msg,
        role:'Auth',
        cmd:'update',
        model:'Teams',
        key:shift.teamKey,
      })
    } else {
      return await this.prior(msg)
    }
  })

  add({role:'Auth',cmd:'create',model:'Shifts'}, async function(msg) {
    return await this.act({
      ...msg,
      role:'Auth',
      cmd:'update',
      model:'Teams',
      key:msg.values.teamKey,
    })
  })

  add({role:'Auth',model:'Organizers'}, async function(msg) {
    const {organizer} = await this.act({role:'Firebase',cmd:'get',organizer:msg.key})

    return await this.act({
      ...msg,
      model:'Projects',
      cmd:'update',
      key: organizer.projectKey,
    })
  })

  add({role:'Auth',model:'Organizers',cmd:'create'}, async function(msg) {
    return await this.act({
      ...msg,
      model:'Projects',
      cmd:'update',
      key: msg.values.projectKey,
    })
  })

  add({role:'Auth',model:'Organizers',cmd:'accept'}, async function({uid}) {
    const data = await this.act({role:'Firebase',cmd:'get',profile:{uid}})
    return pass(prop('profile'), 'Must have a profile', data)
  })

  add({role:'Auth', model:'Profiles', cmd:'update'},
    async function({uid, key}) {
      const [myProfile, profile] = await Promise.all([
        this.act({role:'Firebase',model:'Profiles',cmd:'first',by:'uid',value:uid}),
        this.act({role:'Firebase',model:'Profiles',cmd:'get',key}),
      ])

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
}
