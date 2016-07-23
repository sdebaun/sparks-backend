import defaults from './defaults'

function actions() {
  return defaults(this, 'Fulfillers')
    .init('create', 'remove', 'update')
}

export default actions
