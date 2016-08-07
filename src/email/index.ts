/// <reference path="../sendgrid.d.ts" />
import * as assert from 'assert'
import * as SendGrid from 'sendgrid'

const sendgrid = SendGrid(process.env.SENDGRID_KEY)
const DOMAIN = process.env.DOMAIN

function actions() {
  function sendGridSend(email) {
    return new Promise(function(resolve, reject) {
      sendgrid.send(email, (err, json) => {
        if (err) { return reject(err) }
        return resolve(json)
      })
    })
  }

  this.add({role:'email',cmd:'send',email:'engagement'}, async function({profileKey, oppKey, key, templateId, subject, sendAt}) {
    const {profile, opp, project} = await this.act('role:Firebase,cmd:get', {
      profile: profileKey,
      opp: oppKey,
      project: ['opp', 'projectKey'],
    })

    assert(profile, 'Profile not found')
    assert(opp, 'Opp not found')
    assert(project, 'Project not found')

    const email = new sendgrid.Email()
    email.addTo(profile.email)
    email.subject = subject + ` ${project.name}`
    email.from = 'help@sparks.network'
    email.html = ' '

    email.addFilter('templates', 'enable', 1)
    email.addFilter('templates', 'template_id', templateId)

    email.addSubstitution('-username-', profile.fullName)
    email.addSubstitution('-opp_name-', opp.name)
    email.addSubstitution('-project_name-', project.name)
    email.addSubstitution('-engagementurl-', `${DOMAIN}/engaged/${key}/`)

    if (sendAt) { email.setSendAt(sendAt) }

    return await sendGridSend(email)
  })

  this.add({role:'email',cmd:'send',email:'organizer'}, async function({values, project, key, templateId, subject, sendAt}) {
    const email = new sendgrid.Email()
    email.addTo(values.inviteEmail)
    email.subject = subject + ` ${project.name}`
    email.from = 'help@sparks.network'
    email.setFromName('Sparks.Network')
    email.html = ' '

    email.addFilter('templates', 'enable', 1)
    email.addFilter('templates', 'template_id', templateId)

    email.addSubstitution('-project_name-', project.name)
    email.addSubstitution('-invite_url-', `${DOMAIN}/organize/${key}/`)

    if (sendAt) { email.setSendAt(sendAt) }

    return await sendGridSend(email)
  })

  return 'Emails'
}

export default actions
