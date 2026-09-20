// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import type React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import MapEmbed from './MapEmbed'

// The whole point of this component is that the first render costs nothing.
// The Google Maps embed pulls ~445 KiB — 41% of a location page's weight —
// so if an iframe ever reappears in the initial markup, the regression is
// invisible in the UI and only shows up as a Lighthouse drop.

const props = {
  address: '7802 Madison St, Forest Park, IL 60130',
  locationName: 'Madison St',
  directionsUrl: 'https://www.google.com/maps/search/?api=1&query=7802+Madison+St',
}

const html = (over: Partial<React.ComponentProps<typeof MapEmbed>> = {}) =>
  renderToStaticMarkup(<MapEmbed {...props} {...over} />)

describe('MapEmbed — initial render', () => {
  it('renders no iframe', () => {
    expect(html()).not.toContain('<iframe')
  })

  it('makes no request to Google Maps', () => {
    const markup = html()
    expect(markup).not.toContain('maps.google.com')
    expect(markup).not.toContain('output=embed')
  })

  it('shows the real address rather than a placeholder image', () => {
    // An honest control beats a decorative picture of a map that isn't the map.
    expect(html()).toContain('7802 Madison St, Forest Park, IL 60130')
  })

  it('names the location', () => {
    expect(html()).toContain('Madison St')
  })

  it('offers a control to load the map', () => {
    expect(html()).toMatch(/Show interactive map/i)
  })

  it('keeps directions reachable without loading the embed', () => {
    // The common intent — open this in my phone's maps app — should never
    // need 445 KiB of JavaScript.
    // `&` is HTML-escaped in rendered markup, so compare the decoded href.
    const markup = html().replace(/&amp;/g, '&')
    expect(markup).toContain(props.directionsUrl)
    expect(markup).toContain('rel="noopener noreferrer"')
  })

  it('tells the visitor why the map is not already there', () => {
    expect(html()).toMatch(/loads from Google only when you open it/i)
  })

  it('applies the caller layout classes so the slot keeps its size', () => {
    // The placeholder must occupy the same box as the iframe would, or
    // swapping it in shifts the page (CLS).
    expect(html({ className: 'h-[400px] w-full' })).toContain('h-[400px] w-full')
  })
})
