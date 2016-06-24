import Promise from 'bluebird'
import moment from 'moment-timezone'
import {join, tap} from 'ramda'

function actions({models}) {
  const {Shifts} = models
  const act = Promise.promisify(this.act, {context: this})

  const shiftTimes = values => {
    const date = moment(join('', [values.date, 'T', '00:00:00Z'])).tz('utc')
    const start = date.clone().add(values.start, 'hours')
    const end = start.clone().add(values.hours, 'hours')

    return tap(c => console.log(c), {
      ...values,
      date: date.format('YYYY-MM-DD'),
      startTime: start.format(),
      endTime: end.format(),
      start: moment.duration(start.diff(date)).asHours(),
      end: moment.duration(end.diff(date)).asHours(),
    })
  }

  this.add({role:'Shifts',cmd:'create'}, ({values, profile}, respond) => {
    const key = Shifts.push({
      ...shiftTimes(values),
      ownerProfileKey: profile.$key,
    }).key()

    respond(null, {key})
  })

  this.add({role:'Shifts',cmd:'remove'}, ({key}, respond) =>
    Shifts.child(key).remove()
    .then(() => respond(null, {key}))
    .catch(err => respond(err)))

  this.add({role:'Shifts',cmd:'update'}, ({key, values}, respond) =>
    Shifts.child(key).update(shiftTimes(values))
    .then(() => act({
      role:'Shifts',
      cmd:'updateCounts',
      key:key,
    }))
    .then(() => respond(null, {key}))
    .catch(err => respond(null, {
      msg: 'Could not update shifts',
      err,
    }))
  )

  this.add({role:'Shifts',cmd:'updateCounts'}, ({key}, respond) =>
    act({role:'Firebase',cmd:'get',
      assignments: {shiftKey: key},
      shift: key,
    })
    .then(({assignments}) => assignments.length)
    .then(assigned => Shifts.child(key).update({assigned})
      .then(() => respond(null, {assigned}))
    )
    .catch(err => respond(null, {err}))
  )

  return {
    name: 'Shifts',
  }
}

export default actions
