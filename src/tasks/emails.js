import SendGrid from 'sendgrid'

const sendgrid = SendGrid(process.env.SENDGRID_KEY)
const DOMAIN = process.env.DOMAIN

function actions({getStuff, models: {Projects}}) {
  this.add({role:'email',cmd:'getInfo'},
          ({key, oppKey, profileKey, uid}, respond) =>
    getStuff({
      profile: profileKey,
      opp: oppKey,
    }).then(({profile, opp}) =>
      Projects.get(opp.projectKey)
      .then(project =>
        respond(null, {project, opp, profile, key, uid, profileKey}))))

  this.add({role:'email',cmd:'send',email:'engagement'},
  (
    {profile, project, opp, key, uid, templateId, subject, sendAt = false},
    respond
  ) => {
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

    sendgrid.send(email, (err, json) => {
      if (err) {
        console.error(err)
        return respond(err)
      }
      console.log(json)
      respond(null, json)
    })
  })

  this.add({role:'email',cmd:'send',email:'organizer'},
  ({values, project, key, templateId, subject, sendAt = false}, respond) => {
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

    sendgrid.send(email, (err, json) => {
      if (err) {
        console.error(err)
        return respond(err)
      }

      respond(null, json)
    })
  })
}

export default actions
