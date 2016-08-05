import role from './role'
import AuthEngagements from './Engagements'
import AuthArrivals from './Arrivals'

export default function() {
  const seneca = this
  seneca
    .use(role)
    .use(AuthEngagements)
    .use(AuthArrivals)
    .ready(function() {
      /*
      * Try/catch wrapper that converts errors into rejections
      */
      seneca.wrap('role:Auth', async function(msg) {
        try {
          return await this.prior(msg)
        } catch (error) {
          return {reject: error, error}
        }
      })
    })

  return 'sn-auth'
}
