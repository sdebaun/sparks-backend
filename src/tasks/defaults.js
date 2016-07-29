const defaultActions = {
  create: function(model) {
    this.add({role:model,cmd:'create'}, async function({values}) {
      return await this.act('role:Firebase,cmd:push', {model, values})
    })},
  remove: function(model) {
    this.add({role:model,cmd:'remove'}, async function({key}) {
      return await this.act('role:Firebase,cmd:remove', {model, key})
    })},
  update: function(model) {
    this.add({role:model,cmd:'update'}, async function({key, values}) {
      return await this.act('role:Firebase,cmd:update', {model, key, values})
    })},
  set: function(model) {
    this.add({role:model,cmd:'set'}, async function({key, values}) {
      return await this.act('role:Firebase,model:ProjectImages,cmd:set', {key, values})
    })},
}

function defaults(fn, ...actions) {
  const name = fn.name

  return function() {
    const seneca = this

    for (let action of actions) {
      defaultActions[action].bind(seneca)(name)
    }

    fn.call(seneca)
    return name
  }
}

export default defaults
