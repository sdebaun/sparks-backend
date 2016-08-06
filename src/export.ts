/* eslint-disable max-nested-callbacks */
import load from './load'
import {propEq, join, find, tap, concat, compose, curryN, merge} from 'ramda'
import {format} from 'util'
import {objToRows} from './collections'

function out(...msg:any[]):void {
  const str:string = format(...msg)
  process.stderr.write(`${str}\n`)
}

const PROJECT:any = process.argv[2] || null

const PROJECT_NAMES = {
  'Northern Nights': 'NN2016',
  'Disc Jam': 'DISCJAM2016',
  'Wild Woods': 'WILDWOODS2016',
  'Cosmic Alignment': 'Cosmic2016',
  'Stilldream Festival': 'STILLDREAM2016',
}

function getStatusCode(engagement) {
  const {
    isApplied = false,
    isAccepted = false,
    isConfirmed = false,
    declined = false,
  } = engagement

  if (declined) {
    return 'REJECTED'
  }

  if (isApplied) {
    if (isAccepted) {
      if (isConfirmed) {
        return 'CONFIRMED'
      }
      return 'APPROVED'
    }
    return 'APPLIED'
  }
}

const snap = s => s.val()

function sortByName([a], [b]) {
  if (a.fullName < b.fullName) { return -1 }
  if (a.fullName > b.fullName) { return 1 }
  return 0
}

async function exportVols() {
  const seneca = await load()
  const {fb} = await seneca.act({role:'Firebase'})

  const getProfile = engagement =>
    fb.child('Profiles')
      .child(engagement.profileKey)
      .once('value')
      .then(s => s.val())
      .then(val => [val, getStatusCode(engagement)])

  const getProject = e =>
    fb.child('Opps')
      .child(e.oppKey)
      .once('value')
      .then(s => s.val())
      .then(x =>
        fb.child('Projects')
          .child(x.projectKey)
          .once('value')
          .then(s => [s.val(), e])
      )

  fb.child('Projects').once('value')
  .then(s => s.val())
  .then(objToRows)
  .then(find(propEq('name', PROJECT)))
  .then(tap<any>(p => out('Found project', p.name)))
  .then(project =>
    fb.child('Opps')
      .orderByChild('projectKey')
      .equalTo(project.$key)
      .once('value')
    .then(snap)
    .then(objToRows)
    .then(tap<any>(rows => out('Found', rows.length, 'Opps')))
    .then(opps =>
      Promise.all(opps.map(opp =>
        fb.child('Engagements')
          .orderByChild('oppKey')
          .equalTo(opp.$key)
          .once('value')
        .then(snap)
        .then(objToRows)
        .then(tap<any>(rows => out('Found', rows.length, 'Engagements')))
        .then(engs => Promise.all(engs.map(eng =>
          fb.child('Profiles').child(eng.profileKey).once('value')
          .then(snap)
          .then(profile => merge(eng, {profile}))
        )))
        .then(engs => merge(opp, {engs}))
      ))
    )
  )
  .then(opps =>
    opps.reduce((acc, opp) =>
      concat(acc, opp.engs.map(eng =>
        [eng.profile.fullName,
          eng.profile.email,
          eng.profile.phone,
          PROJECT_NAMES[PROJECT],
          getStatusCode(eng),
          opp.name,
        ]
        .map(String)
        .map(str => format('"%s"', str))
      )),
      []
    )
  )
  .then(tap<any>(rows => out('Preparing to write', rows.length, 'rows')))
  .then(rows =>
    rows.map(join(','))
  )
  .then(lines =>
    lines.forEach(line =>
      console.log(line)
    )
  )
  .then(() => process.exit())
  .catch(err => {
    console.error('err', err)
    process.exit()
  })
}

exportVols()
