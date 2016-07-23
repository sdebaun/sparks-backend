import defaults from './defaults'

function actions() {
  return defaults(this, 'ProjectImages')
    .init('set', 'remove')
}

export default actions
