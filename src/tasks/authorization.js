import Promise from 'bluebird'
import {
  equals, anyPass, unless, pathOr, juxt, compose, apply, contains, map, prop,
  path, append, propOr, merge,
} from 'ramda'
import {getStuff} from '../util'

export const isAdmin = propOr(false, 'isAdmin')

export const isEAP = propOr(false, 'isEAP')

export const isUser = (profile, key) => profile && profile.$key === key

const rejectWith = message => data =>
  console.log('Auth error', message, data) || Promise.reject(message)

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

// Each of these will return a promise that rejects if the authentication rules
// fail, otherwise will resolve with an object containing anything it loaded.

// Resolves {profile, project}
export const userCanCreateProject = ({uid}, models) =>
  getStuff(models)({profile: {uid}})
  .then(rejectUnless(
    'User cannot create project',
    anyPass(createProjectRules)))

// Resolves {profile, project, organizers}
export const userCanUpdateProject = ({uid, projectKey}, models) =>
  getStuff(models)({
    profile: {uid},
    project: projectKey,
    organizers: {projectKey},
  })
  .then(rejectUnless(
    'User cannot update project',
    anyPass(updateProjectRules)))

// Resolves {profile, project}
export const userCanRemoveProject = ({uid, projectKey}, models) =>
  getStuff(models)({
    profile: {uid},
    project: projectKey,
  })
  .then(rejectUnless(
    'User cannot remove project',
    anyPass(removeProjectRules)))

// Resolves {profile, team, project, organizers}
export const userCanUpdateTeam = ({uid, teamKey}, models) =>
  getStuff(models)({
    profile: {uid},
    team: teamKey,
  })
  .then(({profile, team}) =>
    getStuff(models)({
      project: team.projectKey,
      organizers: {projectKey: team.projectKey},
    }).then(merge({profile, team})))
  .then(
    rejectUnless(
    'User cannot update team',
    anyPass(updateTeamRules)))

// Resolves {profile, opp, project, organizers}
export const userCanUpdateOpp = ({uid, oppKey}, models) =>
  getStuff(models)({
    profile: {uid},
    opp: oppKey,
  })
  .then(({profile, opp}) =>
    getStuff(models)({
      project: opp.projectKey,
      organizers: {projectKey: opp.projectKey},
    })
    .then(merge({profile, opp})))
  .then(
    rejectUnless(
      'User cannot update opp',
      anyPass(updateOppRules)))
