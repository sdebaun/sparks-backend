export function Profiles() {
  const profiles = {
    volunteer: {
      uid: 'volunteer',
      fullName: 'Mr First',
    },

    volTwo: {
      uid: 'volTwo',
      fullName: 'Mr Second',
    },

    eap: {
      uid: 'eap',
      isEAP: true,
      fullName: 'Mr EAP',
    },

    organizer: {
      uid: 'organizer',
      fullName: 'Mr Organizer',
    },

    teamLead: {
      uid: 'teamLead',
      fullName: 'Mr Leader',
    },

    admin: {
      uid: 'admin',
      isAdmin: true,
      fullName: 'Mr Admin',
    },
  }

  const users = {
    volunteer: {
      profileKey: 'volunteer',
    },

    volTwo: {
      profileKey: 'volTwo',
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

export function Opps() {
  const opps = {
    oppOne: {
      projectKey: 'testFest',
      name: 'Opp One',
    },
  }

  this.add('init:Opps', async function() {
    await this.act({role:'Fixtures',cmd:'set',fixtures:{opps}})
  })

  return 'Opps'
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
      name: 'Test Team',
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
    shiftOne: {
      teamKey: 'testTeam',
    },

    shiftTwo: {
      teamKey: 'testTeam',
    },
  }

  this.add('init:Shifts', async function() {
    await this.act('role:Fixtures,cmd:set',{fixtures:{shifts}})
  })

  return 'Shifts'
}

export function Arrivals() {
  const arrivals = {
    volunteer: {
      projectKey: 'testFest',
      profileKey: 'volunteer',
    },
  }

  this.add('init:Arrivals', async function() {
    await this.act('role:Fixtures,cmd:set',{fixtures:{arrivals}})
  })

  return 'Arrivals'
}

export function Engagements() {
  const engagements = {
    volunteer: {
      projectKey: 'testFest',
      oppKey: 'oppOne',
      profileKey: 'volunteer',
      answer: 'the proof is in the pudding',
      isAssigned: false,
      isPaid: false,
      isConfirmed: false,
      isAccepted: false,
      paymentClientToken: 'imaprettyboy',
    },
  }

  this.add('init:Engagements', async function() {
    await this.act('role:Fixtures,cmd:set',{fixtures:{engagements}})
  })

  return 'Engagements'
}

export function Assignments() {
  const assignments = {
    volunteerShiftOne: {
      engagementKey: 'volunteer',
      oppKey: 'oppOne',
      profileKey: 'volunteer',
      shiftKey: 'shiftOne',
      teamKey: 'testTeam',
    },
  }

  this.add('init:Assignments', async function() {
    await this.act('role:Fixtures,cmd:set',{fixtures:{assignments}})
  })

  return 'Assignments'
}

export function Memberships() {
  const memberships = {
    volunteerTestTeam: {
      engagementKey: 'volunteer',
      isAccepted: false,
      isApplied: true,
      isConfirmed: false,
      isDeclined: false,
      oppKey: 'oppOne',
      teamKey: 'testTeam',
    },
  }

  this.add('init:Memberships', async function() {
    await this.act('role:Fixtures,cmd:set',{fixtures:{memberships}})
  })

  return 'Memberships'
}

export default function() {
  this
    .use(Profiles)
    .use(Projects)
    .use(Organizers)
    .use(Teams)
    .use(Shifts)
    .use(Arrivals)
    .use(Opps)
    .use(Engagements)
    .use(Assignments)
    .use(Memberships)
  return 'fixtures'
}
