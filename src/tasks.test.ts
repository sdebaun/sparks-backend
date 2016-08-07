import {difference, compose, filter, allPass, apply, prop, not} from 'ramda'
import tape from './test/tape-seneca'
import Tasks from './tasks'
import Auth from './auth'

const test = tape('tasks', [])

test('auth for every task', async function(t) {
  const beforeTasks = this.list()

  this.use(Tasks)
  await this.ready()

  const afterTasks = this.list()

  const tasks = compose<any[], any[], any[]>(
    filter(allPass([prop('role'), prop('cmd')])),
    apply<any, any>(difference),
  )([afterTasks, beforeTasks])

  this.use(Auth)
  await this.ready()

  for (let taskPattern of tasks) {
    const task = this.find(taskPattern)
    if (task.raw.public$ === false) { continue }

    const pattern = {
      role: 'Auth',
      model: taskPattern.role,
      cmd: taskPattern.cmd,
    }

    const authTask = this.find(pattern)

    if (authTask) {
      const notDefault = not(authTask.raw.default$)
      t.ok(notDefault, `${task.plugin_fullname} / ${task.pattern} has auth task`)
    } else {
      t.fail(`${task.plugin_fullname} / ${task.pattern} has auth task`)
    }
  }
})
