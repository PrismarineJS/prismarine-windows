/* eslint-env mocha */
const assert = require('assert')
const PWindow = require('prismarine-windows')

describe('check number of windows', () => {
  const tests = {
    1.8: 15,
    '1.10': 15,
    1.14: 24,
    1.15: 24,
    1.16: 25,
    1.17: 25
  }
  for (const [version, len] of Object.entries(tests)) {
    it('check: ' + version, () => {
      const { windows } = PWindow(version)
      assert.strictEqual(Object.entries(windows).length, len, 'test failed for version: ' + version)
    })
  }
})
