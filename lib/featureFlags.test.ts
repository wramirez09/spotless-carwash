// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { isSubscribeHref, subscriptionsEnabled } from './featureFlags'

describe('subscriptionsEnabled', () => {
  it('is off by default on Vercel Production', () => {
    // The feature has no Stripe setup yet — a visible link there would dead-end
    // a real customer at checkout.
    expect(subscriptionsEnabled({ VERCEL_ENV: 'production' })).toBe(false)
  })

  it('is on by default everywhere else', () => {
    // Local dev, preview deploys and e2e must keep exercising the flow.
    expect(subscriptionsEnabled({ VERCEL_ENV: 'preview' })).toBe(true)
    expect(subscriptionsEnabled({ VERCEL_ENV: 'development' })).toBe(true)
    expect(subscriptionsEnabled({})).toBe(true)
  })

  it.each(['true', 'TRUE', ' true ', '1'])(
    'can be switched on in production with %s',
    (raw) => {
      expect(subscriptionsEnabled({ VERCEL_ENV: 'production', SUBSCRIPTIONS_ENABLED: raw })).toBe(true)
    },
  )

  it.each(['false', 'FALSE', '0'])('can be switched off anywhere with %s', (raw) => {
    expect(subscriptionsEnabled({ VERCEL_ENV: 'preview', SUBSCRIPTIONS_ENABLED: raw })).toBe(false)
  })

  it('ignores an unparseable value and falls back to the environment default', () => {
    // A typo like "yes" must not silently expose an unfinished feature.
    expect(subscriptionsEnabled({ VERCEL_ENV: 'production', SUBSCRIPTIONS_ENABLED: 'yes' })).toBe(false)
  })

  it('treats an empty value as unset', () => {
    expect(subscriptionsEnabled({ VERCEL_ENV: 'production', SUBSCRIPTIONS_ENABLED: '' })).toBe(false)
  })
})

describe('isSubscribeHref', () => {
  it('matches the subscription routes', () => {
    expect(isSubscribeHref('/buy-tokens/subscribe')).toBe(true)
    expect(isSubscribeHref('/buy-tokens/subscribe/success')).toBe(true)
  })

  it('does not match the one-time token store', () => {
    expect(isSubscribeHref('/buy-tokens')).toBe(false)
    expect(isSubscribeHref(undefined)).toBe(false)
    expect(isSubscribeHref(null)).toBe(false)
  })
})
