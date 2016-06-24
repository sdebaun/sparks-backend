import Arrivals from './Arrivals'
import Assignments from './Assignments'
import Commitments from './Commitments'
import Engagements from './Engagements'
import Fulfillers from './Fulfillers'
import Memberships from './Memberships'
import Opps from './Opps'
import Organizers from './Organizers'
import Profiles from './Profiles'
import ProjectImages from './ProjectImages'
import Projects from './Projects'
import Shifts from './Shifts'
import TeamImages from './TeamImages'
import Teams from './Teams'
import Emails from './emails'

export default function(options) {
  const seneca = this
  seneca.use(Arrivals, options)
  seneca.use(Assignments, options)
  seneca.use(Commitments, options)
  seneca.use(Engagements, options)
  seneca.use(Fulfillers, options)
  seneca.use(Memberships, options)
  seneca.use(Opps, options)
  seneca.use(Organizers, options)
  seneca.use(Profiles, options)
  seneca.use(Projects, options)
  seneca.use(ProjectImages, options)
  seneca.use(Shifts, options)
  seneca.use(TeamImages, options)
  seneca.use(Teams, options)
  seneca.use(Emails, options)

  return 'sn-tasks'
}
