import {expect, test} from 'bun:test'

const {default: tomni} = await import('#src/main.ts')

test('should run', () => {
  const result = tomni()
  expect(result).toBe('tomni') // TODO Test actual functionality
})
