import Promise from 'bluebird'
import {
  anyPass, append, apply, compose, contains, equals, juxt, map, path,
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
    apply(equals),
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

// Lists of rules
const createProjectRules = [
  profileIsAdmin,
  profileIsEAP,
]

const updateProjectRules = [
  profileIsAdmin,
  profileIsProjectOwner,
  profileIsActiveOrganizer,
]

const removeProjectRules = [
  profileIsAdmin,
  profileIsProjectOwner,
]

const updateTeamRules = append(profileIsTeamOwner, updateProjectRules)
const updateOppRules = append(profileIsOppOwner, updateProjectRules)

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

  add({role:'Auth'}, async function ({uid}) {
    return await this.act({role:'Firebase',cmd:'get',profile:{uid}})
  })

  add({role:'Auth',cmd:'create',model:'Projects'}, async function({uid}) {
    const {profile} = await this.act({role:'Firebase',cmd:'get',profile:{uid}})

    return pass(
      anyPass(createProjectRules),
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
      anyPass(updateProjectRules),
      'User cannot update project',
      objects
    )
  })

  add({role:'Auth',cmd:'remove',model:'Projects'}, async function({uid, projectKey}) {
    const objects = await this.act({role:'Firebase',cmd:'get',
      profile: {uid},
      project: projectKey,
    })

    return pass(
      anyPass(removeProjectRules),
      'User cannot remove project',
      objects
    )
  })

  add({role:'Auth',cmd:'update',model:'Teams'}, async function({uid, teamKey}) {
    const {profile, team} = await this.act({role:'Firebase',cmd:'get',
      profile: {uid},
      team: teamKey,
    })

    const {project, organizers} = await this.act({role:'Firebase',cmd:'get',
      project: team.projectKey,
      organizers: {projectKey: team.projectKey},
    })

    return pass(
      anyPass(updateTeamRules),
      'User cannot update team',
      {profile, team, project, organizers}
    )
  })

  add({role:'Auth',model:'TeamImages'}, async function({key}) {
    return await this.act({role:'Auth',model:'Teams',cmd:'update',key})
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
      anyPass(updateOppRules),
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
        teamKey:shift.teamKey,
      })
    } else {
      return await this.prior(msg)
    }
  })

  add({role:'Auth',cmd:'create',model:'Shifts'}, async function(msg) {
    return await this.act({
      ...msg,
      teamKey:msg.values.teamKey,
      role:'Auth',
      cmd:'update',
      model:'Teams',
    })
  })

  add({role:'Auth',model:'Organizers'}, async function(msg) {
    const {organizer} = await this.act({role:'Firebase',cmd:'get',organizer: msg.key})

    return await this.act({
      ...msg,
      model:'Projects',
      cmd:'update',
      key: organizer.projectKey,
    })
  })

  add({role:'Auth',model:'Organizers'}, async function(msg) {
    return await this.act({
      ...msg,
      model:'Projects',
      cmd:'update',
      key: msg.values.projectKey,
    })
  })

  add({role:'Auth',model:'Organizers',cmd:'accept'}, async function({uid}) {
    return await this.act({role:'Firebase',cmd:'get',profile:{uid}})
  })

  add({role:'Auth', model:'Profiles', cmd:'update'},
    async function({uid, key}) {
      const [myProfile, profile] = await Promise.all([
        this.act({role:'Firebase',model:'Profiles',cmd:'first',by:'uid',value:uid}),
        this.act({role:'Firebase',model:'Profiles',cmd:'get',key}),
      ])

      if (myProfile.isAdmin || profile.uid === uid) {
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
