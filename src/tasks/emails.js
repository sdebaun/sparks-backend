const sendgrid = require('sendgrid')(process.env['SENDGRID_KEY'])
const DOMAIN = process.env['DOMAIN']

export function getEmailInfo({key, oppKey, profileKey, uid, Profiles, Opps, Projects}) { //eslint-disable-line max-len
  return Promise.all([Profiles.get(profileKey), Opps.get(oppKey)])
    .then(([profile, opp]) =>
      Projects.get(opp.projectKey)
        .then(project => ({project, opp, user: profile, key, uid, profileKey}))
    )
}

export function sendEngagmentEmail({user, project, opp, key, uid}, {templateId, subject, sendAt = false}) { // eslint-disable-line max-len
  const email = new sendgrid.Email()
  email.addTo(user.email)
  email.subject = subject + ` ${project.name}`
  email.from = 'help@sparks.network'
  email.html = ' '

  email.addFilter('templates', 'enable', 1)
  email.addFilter('templates', 'template_id', templateId)

  email.addSubstitution('-username-', user.fullName)
  email.addSubstitution('-opp_name-', opp.name)
  email.addSubstitution('-project_name-', project.name)
  email.addSubstitution('-engagementurl-', `${DOMAIN}/engaged/${key}/`)

  if (sendAt) { email.setSendAt(sendAt) }

  sendgrid.send(email, (err, json) => {
    if (err) { return console.error(err) }
    console.log(json)
  })

  return arguments[0]
}

export function sendOrganizerEmail({values, project, key}, {templateId, subject, sendAt = false}) { // eslint-disable-line max-len
  const email = new sendgrid.Email()
  email.addTo(values.inviteEmail)
  email.subject = subject + ` ${project.name}`
  email.from = 'help@sparks.network'
  email.html = ' '

  email.addFilter('templates', 'enable', 1)
  email.addFilter('templates', 'template_id', templateId)

  email.addSubstitution('-project_name-', project.name)
  email.addSubstitution('-invite_url-', `${DOMAIN}/organize/${key}/`)

  if (sendAt) { email.setSendAt(sendAt) }

  sendgrid.send(email, (err, json) => {
    if (err) { return console.error(err) }
    console.log(json)
  })

  return arguments[0]
}
