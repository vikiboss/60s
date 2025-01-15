import { Common } from '../src/common.ts'

const obj = {
  a: 1,
  b: false,
  c: null,
  d: undefined,
  e: [1, 2],
  f: ['', undefined, 123, '1111'],
}

console.log(Common.qs(obj))
