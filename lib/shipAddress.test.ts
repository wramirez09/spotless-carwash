// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { addressLines, type ShipTo } from './shipAddress'

// These lines are printed on the pick list an admin ships from, so a dropped
// or mangled component is a parcel that doesn't arrive.

function ship(overrides: Partial<ShipTo> = {}): ShipTo {
  return {
    ship_line1: '123 Madison St',
    ship_line2: null,
    ship_city: 'Forest Park',
    ship_state: 'IL',
    ship_postal_code: '60130',
    ship_country: 'US',
    ...overrides,
  }
}

describe('addressLines', () => {
  it('formats a complete address', () => {
    expect(addressLines(ship())).toEqual(['123 Madison St', 'Forest Park, IL 60130'])
  })

  it('includes line 2 when present', () => {
    expect(addressLines(ship({ ship_line2: 'Apt 4B' }))).toEqual([
      '123 Madison St',
      'Apt 4B',
      'Forest Park, IL 60130',
    ])
  })

  it('omits the comma when the state is missing', () => {
    expect(addressLines(ship({ ship_state: null }))).toEqual([
      '123 Madison St',
      'Forest Park 60130',
    ])
  })

  it('omits the city line entirely when city, state and zip are all missing', () => {
    expect(
      addressLines(ship({ ship_city: null, ship_state: null, ship_postal_code: null })),
    ).toEqual(['123 Madison St'])
  })

  it('drops whitespace-only fields rather than printing blank lines', () => {
    expect(addressLines(ship({ ship_line1: '   ', ship_line2: 'Apt 4B' }))).toEqual([
      'Apt 4B',
      'Forest Park, IL 60130',
    ])
  })

  it('returns nothing for a null or undefined subscriber', () => {
    expect(addressLines(null)).toEqual([])
    expect(addressLines(undefined)).toEqual([])
  })

  it('returns nothing when every field is empty', () => {
    expect(
      addressLines({
        ship_line1: null,
        ship_line2: null,
        ship_city: null,
        ship_state: null,
        ship_postal_code: null,
        ship_country: null,
      }),
    ).toEqual([])
  })

  it('handles a zip with no city or state', () => {
    expect(addressLines(ship({ ship_city: null, ship_state: null }))).toEqual([
      '123 Madison St',
      '60130',
    ])
  })
})
