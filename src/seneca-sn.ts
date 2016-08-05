import snFirebase from './firebase-sn'
import firebaseGet from './firebase-get'
import braintree from './braintree'
import auth from './auth'
import tasks from './tasks'
import email from './email'

const collections = [
  'Arrivals',
  'Assignments',
  'Commitments',
  'Engagements',
  'Fulfillers',
  'Memberships',
  'Opps',
  'Organizers',
  'Projects',
  'ProjectImages',
  'Profiles',
  'Shifts',
  'Teams',
  'TeamImages',
]

export default function({cfg}) {
  const seneca = this
  seneca.use(snFirebase, {cfg, collections})
  seneca.use(firebaseGet)
  seneca.use(email)
  seneca.use(braintree, cfg)

  seneca.ready(() => {
    seneca.act({role:'Firebase',cmd:'Models'}, (err, {models}) => {
      const remote = {models}

      seneca.use(tasks, remote)
      seneca.ready(() => {
        seneca.use(auth, {collections})
      })
    })
  })

  return 'sn'
}
