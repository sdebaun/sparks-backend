import Promise from 'bluebird'
import {propEq} from 'ramda'
import defaults from './defaults'

function Assignments() {
  const seneca = this
  const act = Promise.promisify(this.act, {context: this})

  async function updateEngagement(key, by) {
    const {assignment} = await act({role:'Firebase',cmd:'get',assignment: key})
    return await seneca.act({role:'Engagements',cmd:'updateAssignmentCount', key: assignment.engagementKey, by})
  }

  async function updateAssignmentStatus(engagementKey) {
    const {engagement, assignments} = await seneca.act('role:Firebase,cmd:get', {
      engagement: engagementKey,
      assignments: {engagementKey},
    })
    const {commitments} = await seneca.act('role:Firebase,cmd:get', {
      commitments: {oppKey: engagement.oppKey},
    })

    const shiftCommit = commitments.find(propEq('code', 'shifts'))
    const requiredAssignments = parseInt(shiftCommit.count, 10) || 0
    const isAssigned = assignments.length >= requiredAssignments

    return await seneca.act('role:Firebase,model:Engagements,cmd:update',
      {key: engagementKey, values: {isAssigned}})
  }

  this.add({role:'Assignments',cmd:'create'}, async function({values}) {
    const {key} = await this.act('role:Firebase,cmd:push,model:Assignments', {values})
    await this.act('role:Shifts,cmd:updateCounts', {key: values.shiftKey})
    return {key}
  })

  this.add({role:'Assignments',cmd:'remove'}, async function({key}) {
    const {assignment} = await this.act({role:'Firebase',cmd:'get',assignment:key})
    const {error} = await this.act({role:'Firebase',model:'Assignments',cmd:'remove',key})
    if (error) { return {error} }

    if (assignment.shiftKey) {
      this.act('role:Shifts,cmd:updateCounts', {key: assignment.shiftKey})
    }

    updateAssignmentStatus(assignment.engagementKey)

    return {key}
  })

  this.add({role:'Assignments',cmd:'update'}, async function({key, values}) {
    return await this.act('role:Firebase,model:Assignments,cmd:update', {
      key, values,
    })
  })

  this.wrap({role:'Assignments',cmd:'remove'}, async function(msg) {
    updateEngagement(msg.key, -1)
    return await this.prior(msg)
  })

  this.wrap({role:'Assignments',cmd:'create'}, async function(msg) {
    const engagementKey = msg.values.engagementKey
    const response = await this.prior(msg)

    if (response.key) {
      seneca.act({role:'Engagements',cmd:'updateAssignmentCount', key: engagementKey, by: 1})
    }

    return response
  })

  return {
    name: 'Assignments',
  }
}

export default defaults(Assignments)
