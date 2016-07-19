import role from './role'

export default function() {
  const seneca = this
  seneca.use(role)
  return 'sn-auth'
}
