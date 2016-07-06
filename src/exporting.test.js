import test from 'tape'
import {rowsToCsv, quoter} from './exporting.js'

const FIXTURES = [['foo', 'bar'], ['baz','boz']]

test('rowsToCsv will convert', t => {
  const result = rowsToCsv(FIXTURES)
  t.equal(result.length, FIXTURES.length, 'Has the same number of rows')
  t.equal(result[0], 'foo,bar', 'First row is CSV')
  t.equal(result[1], 'baz,boz', 'Second row is CSV')
  t.end()
})

test.only('quoter quotes', t => {
  t.equal(quoter('foo'), '"foo"', 'it quotes things')
  t.equal(quoter(undefined), '"undefined"', 'it handles undefined')
  t.equal(quoter(null), '"null"', 'it handles null')
  t.equal(quoter(1234), '"1234"', 'it handles numbers')
  t.end()
})
