import {
  find, values, propEq,
} from 'ramda'

export function Profiles() {
  const profiles = {
    volunteer: {
      uid: 'volunteer',
    },

    eap: {
      uid: 'eap',
      isEAP: true,
    },

    organizer: {
      uid: 'organizer',
    },

    teamLead: {
      uid: 'teamLead',
    },

    admin: {
      uid: 'admin',
      isAdmin: true,
    },
  }

  const users = {
    volunteer: {
      profileKey: 'volunteer',
    },

    eap: {
      profileKey: 'eap',
    },

    organizer: {
      profileKey: 'organizer',
    },

    teamLead: {
      profileKey: 'teamLead',
    },

    admin: {
      profileKey: 'admin',
    },
  }

  this.add('init:Profiles', async function() {
    await this.act({role:'Fixtures',cmd:'set',fixtures:{profiles}})
    await this.act({role:'Fixtures',cmd:'set',fixtures:{users}})
  })

  this.add('role:Firebase,model:Profiles,cmd:first,by:uid', async function({value}) {
    return find(propEq('uid', value), values(profiles))
  })

  this.add('role:Firebase,model:Profiles,cmd:get', async function({key}) {
    return profiles[key]
  })

  return 'Profiles'
}

export function Projects() {
  const projects = {
    testFest: {
      ownerProfileKey: 'eap',
      name: 'Test Fest',
      description: 'Volunteer by testing a website. Exciting stuff.',
    },
  }

  this.add('init:Projects', async function() {
    await this.act({role:'Fixtures',cmd:'set',fixtures:{projects}})
  })

  return 'Projects'
}

export function Organizers() {
  const organizers = {
    organizer: {
      profileKey: 'organizer',
      projectKey: 'testFest',
    },
  }

  this.add('init:Organizers', async function() {
    await this.act('role:Fixtures,cmd:set',{fixtures:{organizers}})
  })

  return 'Organizers'
}

export function Teams() {
  const teams = {
    testTeam: {
      projectKey: 'testFest',
      ownerProfileKey: 'teamLead',
    },
  }

  this.add('init:Teams', async function() {
    await this.act('role:Fixtures,cmd:set',{fixtures:{teams}})
  })

  return 'Teams'
}

export function Shifts() {
  const shifts = {
    testShift: {
      teamKey: 'testTeam',
    },
  }

  this.add('init:Shifts', async function() {
    await this.act('role:Fixtures,cmd:set',{fixtures:{shifts}})
  })

  return 'Shifts'
}

export default function() {
  this.use(Profiles).use(Projects).use(Organizers).use(Teams).use(Shifts)
  return 'fixtures'
}
