import Inflection from 'inflection'
import Promise from 'bluebird'
import {
  T, allPass, always, applySpec, complement, compose, cond, equals, filter,
  fromPairs, head, keys, lensPath, map, mapObjIndexed, objOf, prop, propEq,
  tail, type, values, view, omit,
} from 'ramda'

export function firebaseGet() {
  const seneca = this

  function createPromise(spec) {
    const cmd = cond([
      [compose(equals('String'), type), always('get')],
      [prop('isArray'), always('by')],
      [T, always('first')],
    ])

    const pattern = applySpec({
      role: always('Firebase'),
      model:prop('model'),
      cmd: cmd(prop('value')),
      value: prop('value'),
      key: prop('value'),
    })(spec)

    return seneca.act(pattern)
  }

  function resolveDependentValue(value, record) {
    if (type(value) === 'Object') {
      return objOf(head(keys(value)), resolveDependentValue(head(values(value))))
    }

    const lens = lensPath(tail(value))
    return view(lens, record)
  }

  function createDependentPromises(spec, specs) {
    const dependentSpecs = filter(propEq('dependsOn', spec.key))(specs)

    dependentSpecs.forEach(ds => {
      ds.promise = spec.promise.then(r => {
        const value = resolveDependentValue(ds.value, r)
        return createPromise({...ds, value})
      })

      createDependentPromises(ds, specs)
    })
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
  *      opps: {projectKey: ['project', '$key']}
  *    })
  *    stuff.then(({profile, project, opps}) =>
  *      console.log('profile:', profile, 'project:', project, 'opps:', opps))
  *
  * @param {Object<String,String|Object<String,String>>} specs
  * @return {Object<String,Promise>}
  *
  */

  const getDependsOn = cond([
    [
      allPass([
        equals('Object'),
        compose(equals('Array'), head, values),
      ]),
      compose(head, head, values),
    ],
    [
      equals('Array'),
      head,
    ],
    [
      T, null,
    ],
  ])

  function getStuff(stuff) {
    const specs = mapObjIndexed((value, key) => {
      const model = compose(
        Inflection.pluralize,
        Inflection.camelize
      )(key)

      const isArray = type(value) !== 'String' &&
        key === Inflection.pluralize(key)

      const dependsOn = getDependsOn(value)
      const isDeferred = Boolean(dependsOn)

      return {
        key,
        model,
        isArray,
        isDeferred,
        dependsOn,
        value,
      }
    })(stuff)

    const specsWithNoDependencies = compose(
      filter(complement(prop('dependsOn'))),
      values
    )(specs)

    specsWithNoDependencies.forEach(spec => {
      spec.promise = createPromise(spec)
      createDependentPromises(spec, specs)
    })

    const promises = compose(
      fromPairs,
      map(applySpec([prop('key'), prop('promise')])),
      filter(complement(prop('promise'))),
      values,
    )(specs)

    return Promise.props(promises)
  }

  this.add({role:'Firebase',cmd:'get'}, async function(msg) {
    const spec = omit(['role','cmd'], msg)
    return await getStuff(spec)
  })

  return 'firebaseGet'
}
