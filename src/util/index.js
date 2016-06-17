import Inflection from 'inflection'
import Promise from 'bluebird'
import {
  type, keys, values, compose, ifElse, equals, not, apply,
  juxt, head, mapObjIndexed,
} from 'ramda'

const firstKeyValue = juxt([
  compose(head, keys),
  compose(head, values),
])

const arrayModeFn = model =>
  ifElse(
    compose(
      not,
      equals('Object'),
      type,
    ),
    () => Promise.reject('Only object spec supported for array types'),
    compose(
      apply(model.by),
      firstKeyValue,
    ),
  )

const singleModeFn = model =>
  ifElse(
    compose(
      equals('String'),
      type
    ),
    model.get,
    compose(
      apply(model.first),
      firstKeyValue,
    ),
  )

const modelFnFromSpec = (models, key, spec) => {
  const modelKey = Inflection.camelize(key)
  const arrayMode = Boolean(models[modelKey])
  const model = arrayMode ?
    models[modelKey] :
    models[Inflection.pluralize(modelKey)]
  const fn = arrayMode ? arrayModeFn : singleModeFn

  return fn(model)(spec)
}

/**
* Take a spec and return a bunch of things from the database. The spec is an
* object where the key is the name of a model, i.e. project, and the value
* is either a string with the project key OR a key/value pair with the key
* being the field.
*
* If the key is plural then it will resolve an array, otherwise will resolve a
* single item.
*
* @example
*
*    const stuff = getStuff(models)({
*      profile: {uid: '123'},
*      project: 'abc',
*      opps: {projectKey: 'abc'}
*    })
*    stuff.then(({profile, project, opps}) =>
*      console.log('profile:', profile, 'project:', project, 'opps:', opps))
*
* @param {Object<String,String|Object<String,String>>} specs
* @return {Object<String,Promise>}
*
*/
export const getStuff = models =>
  compose(
    Promise.props,
    mapObjIndexed(
      (spec, key) => modelFnFromSpec(models, key, spec))
  )
