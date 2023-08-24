const assert = require('assert')
const wzwasm = require('../.cgenbuild/Release/wz.js')

const key = new Uint8Array(Array.from({ length: 32 }, (_, k) => k))

function test (input, key) {
  const aes = wzwasm.aesCreate(key)
  const nodeAes = require('crypto').createCipheriv('aes-256-ecb', key, null)

  const actual = aes.update(input)
  const expected = new Uint8Array(nodeAes.update(input))
  assert.deepStrictEqual(actual, expected);

  const actualFinal = aes.final()
  const expectedFinal = new Uint8Array(nodeAes.final())
  assert.deepStrictEqual(actualFinal, expectedFinal)

  aes.destroy()
  nodeAes.destroy()
}

function testAutoPadding (input, key) {
  const aes = wzwasm.aesCreate(key)
  const nodeAes = require('crypto').createCipheriv('aes-256-ecb', key, null)
  aes.setAutoPadding(false)
  nodeAes.setAutoPadding(false)

  const actual = aes.update(input)
  const expected = new Uint8Array(nodeAes.update(input))
  assert.deepStrictEqual(actual, expected);

  assert.throws(() => {
    aes.final()
  }, /wrong final block length/)

  assert.throws(() => {
    nodeAes.final()
  }, /wrong final block length/)

  aes.destroy()
  nodeAes.destroy()
}

wzwasm.default({}).then(() => {
  test(new Uint8Array(Array.from({ length: 7 }, (_, k) => k)), key)
  test(new Uint8Array(Array.from({ length: 16 }, (_, k) => k)), key)
  test(new Uint8Array(Array.from({ length: 31 }, (_, k) => k)), key)
  test(new Uint8Array(Array.from({ length: 32 }, (_, k) => k)), key)
  test(new Uint8Array(Array.from({ length: 126 }, (_, k) => k)), key)
  test(new Uint8Array(Array.from({ length: 256 }, (_, k) => k)), key)
  test(new Uint8Array(Array.from({ length: 65536 }, (_, k) => k)), key)
  testAutoPadding(new Uint8Array(Array.from({ length: 7 }, (_, k) => k)), key)
  console.log('all test passed')
})
