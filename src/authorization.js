import Promise from 'bluebird'
import {
  equals, anyPass, unless, pathOr, juxt, compose, apply, contains, map, prop,
  path, append, propOr, merge, tap,
} from 'ramda'

export const isAdmin = propOr(false, 'isAdmin')

export const isEAP = propOr(false, 'isEAP')

export const isUser = (profile, key) => profile && profile.$key === key

const rejectWith = message => data => {
  console.log('Auth error', message, data)
  return Promise.reject(message)
}

/**
* If the given function returns a falsy value then this will reject the
* promise, otherwise it'll pass through it's arguments to the next then.
*
* @param {String} message
* @param {Function} fn
* @return {Promise}
*/
const rejectUnless = (message, fn) => unless(fn, rejectWith(message))

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

const authorizations = (models, getStuff) => {
// Each of these will return a promise that rejects if the authentication rules
// fail, otherwise will resolve with an object containing anything it loaded.

// Resolves {profile, project}
  const userCanCreateProject = ({uid}) =>
  getStuff({profile: {uid}})
  .then(rejectUnless(
    'User cannot create project',
    anyPass(createProjectRules)))

// Resolves {profile, project, organizers}
  const userCanUpdateProject = ({uid, projectKey}) =>
  getStuff({
    profile: {uid},
    project: projectKey,
    organizers: {projectKey},
  })
  .then(tap(d => console.log(d)))
  .then(rejectUnless(
    'User cannot update project',
    anyPass(updateProjectRules)))

// Resolves {profile, project}
  const userCanRemoveProject = ({uid, projectKey}) =>
  getStuff({
    profile: {uid},
    project: projectKey,
  })
  .then(rejectUnless(
    'User cannot remove project',
    anyPass(removeProjectRules)))

// Resolves {profile, team, project, organizers}
  const userCanUpdateTeam = ({uid, teamKey}) =>
  getStuff({
    profile: {uid},
    team: teamKey,
  })
  .then(({profile, team}) =>
    getStuff({
      project: team.projectKey,
      organizers: {projectKey: team.projectKey},
    }).then(merge({profile, team})))
  .then(
    rejectUnless(
    'User cannot update team',
    anyPass(updateTeamRules)))

// Resolves {profile, opp, project, organizers}
  const userCanUpdateOpp = ({uid, oppKey}) =>
  getStuff({
    profile: {uid},
    opp: oppKey,
  })
  .then(({profile, opp}) =>
    getStuff({
      project: opp.projectKey,
      organizers: {projectKey: opp.projectKey},
    })
    .then(merge({profile, opp})))
  .then(
    rejectUnless(
      'User cannot update opp',
      anyPass(updateOppRules)))

  return {
    userCanCreateProject,
    userCanUpdateProject,
    userCanRemoveProject,
    userCanUpdateTeam,
    userCanUpdateOpp,
  }
}
export default authorizations
