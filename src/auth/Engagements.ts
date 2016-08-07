export default function() {
  this.add('role:Auth,model:Engagements,cmd:create', async function({uid, values: {oppKey, profileKey}}):Promise<AuthResponse> {
    const {profile, opp} = await this.act('role:Firebase,cmd:get', {
      profile: {uid},
      opp: oppKey,
    })

    if (profile.$key !== profileKey && !profile.isAdmin) {
      return {reject: 'Cannot apply another user to this engagement'}
    }

    return {opp}
  })

  // Engagements
  this.add('role:Auth,model:Engagements', async function({uid, key, cmd}) {
    const {profile, engagement, opp} = await this.act('role:Firebase,cmd:get', {
      profile: {uid},
      engagement: key,
      opp: ['engagement', 'oppKey'],
    })

    if (profile.isAdmin) {
      return {profile, engagement, userRole: 'project'}
    }

    if (profile.$key === engagement.profileKey) {
      return {profile, engagement, userRole: 'volunteer'}
    }

    if (cmd === 'update' || cmd === 'remove') {
      return await this.act('role:Auth,model:Projects,cmd:update', {uid, key: opp.projectKey})
    }

    return {reject: 'Not authorized to modify engagement'}
  })

  return 'AuthEngagements'
}
