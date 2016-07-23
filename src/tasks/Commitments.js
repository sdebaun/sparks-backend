import defaults from './defaults'

function actions() {
  return defaults(this, 'Commitments')
    .init('create', 'update', 'remove')
}

export default actions
