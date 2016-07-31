
export default function(test) {
  return {
    accepts: function accepts(msg, testFn = test) {
      testFn(`${msg.model} ${msg.cmd} / accepts ${msg.uid}`, async function(t) {
        const response = await this.act({role:'Auth',...msg})
        t.false(response.reject, 'it is accepted')
      })
    },

    rejects: function rejects(msg, testFn = test) {
      testFn(`${msg.model} ${msg.cmd} / rejects ${msg.uid}`, async function(t) {
        const response = await this.act({role:'Auth',...msg})
        t.ok(response.reject, 'it is rejected')
      })
    },
  }
}
