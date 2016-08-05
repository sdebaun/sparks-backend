import tape from 'test/tape-seneca'
import Projects from './Projects'

const test = tape('Projects', [Projects])
const values = {
  name: 'My Project',
}
const profile = {
  $key: 'abc123',
}

test('create', async function(t) {
  const response = await this.act('role:Projects,cmd:create', {profile, values})
  t.ok(response.key, 'project created')

  const {project} = await this.act('role:Firebase,cmd:get', {project: response.key})
  t.equals(project.name, 'My Project')
  t.equals(project.ownerProfileKey, 'abc123')
})

test('update', async function(t) {
  const response = await this.act('role:Projects,cmd:update', {key: 'testFest', values})
  t.ok(response.key)

  const {project} = await this.act('role:Firebase,cmd:get,project:testFest')
  t.equals(project.name, 'My Project')
})

test('remove', async function(t) {
  const response = await this.act('role:Projects,cmd:remove,key:testFest')
  t.ok(response.key)

  const {project} = await this.act('role:Firebase,cmd:get,project:testFest')
  t.false(project)
})
