import { describe, expect, it } from 'vitest'
import { nameFromProfileUrl } from '../src/linkedin/profileUrl'

const IN = 'https://www.linkedin.com/in/'

describe('nameFromProfileUrl (research R4)', () => {
  it.each([
    ['jan-peeters', 'Jan Peeters'],
    ['jan-peeters-1a2b3c', 'Jan Peeters'],
    ['zo%C3%AB-peeters-42', 'Zoë Peeters'],
    ['van-den-broeck', 'Van Den Broeck'],
    ['jpeeters', 'Jpeeters'],
    ['12345', ''],
    ['j-1', ''],
  ])('turns %s into "%s"', (handle, name) => {
    expect(nameFromProfileUrl(IN + handle)).toBe(name)
  })
})
