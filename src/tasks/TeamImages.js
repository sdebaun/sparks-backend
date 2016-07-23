import defaults from './defaults'

function actions() {
  return defaults(this, 'TeamImages')
    .init('set', 'remove')
}

export default actions
