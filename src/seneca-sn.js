import snFirebase from './firebase-sn'
import firebaseGet from './firebase-get'
import auth from './auth'
import tasks from './tasks'

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

export default function({cfg, remote}) {
  const seneca = this
  seneca.use(snFirebase, {cfg, collections})
  seneca.use(firebaseGet)

  seneca.ready(() => {
    seneca.act({role:'Firebase',cmd:'Models'}, (err, {models}) => {
      remote.models = models

      seneca.use(tasks, remote)
      seneca.ready(() => {
        seneca.use(auth, {collections})
      })
    })
  })

  return 'sn'
}
