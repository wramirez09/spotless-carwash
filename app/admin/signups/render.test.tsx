// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import type { Signup, SignupQuery, SignupStats } from '@/lib/signups'

// SignupsTable reaches for the App-Router navigation hooks; stub them so the
// component can render outside a real Next request.
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => '/admin/signups',
  useSearchParams: () => new URLSearchParams(),
}))

import StatCards from './StatCards'
import SignupsTable from './SignupsTable'

const baseQuery: SignupQuery = {
  status: 'all',
  source: null,
  q: '',
  sort: 'created_at',
  dir: 'desc',
  page: 1,
  pageSize: 25,
}

function makeRow(over: Partial<Signup>): Signup {
  return {
    id: 'id-1',
    email: 'a@b.com',
    name: null,
    phone: null,
    source: null,
    marketing_consent: true,
    status: 'subscribed',
    unsubscribed_at: null,
    customer_id: null,
    created_at: '2026-07-01T12:00:00.000Z',
    updated_at: '2026-07-01T12:00:00.000Z',
    ...over,
  }
}

describe('StatCards', () => {
  it('shows totals, percentages and source breakdown', () => {
    const stats: SignupStats = {
      total: 200,
      subscribed: 150,
      unsubscribed: 50,
      newThisWeek: 12,
      sources: [
        { source: 'home', count: 120 },
        { source: 'under_construction', count: 80 },
      ],
      configured: true,
    }
    const html = renderToStaticMarkup(<StatCards stats={stats} />)
    expect(html).toContain('200') // total
    expect(html).toContain('150') // subscribed
    expect(html).toContain('75%') // 150/200 active
    expect(html).toContain('New this week')
    expect(html).toContain('home')
    expect(html).toContain('under_construction')
  })
})

describe('SignupsTable', () => {
  it('renders a row per signup with contact links', () => {
    const rows = [
      makeRow({ id: '1', email: 'jo@x.com', name: 'Jo', phone: '5551234', source: 'home' }),
      makeRow({ id: '2', email: 'sam@x.com', status: 'unsubscribed' }),
    ]
    const html = renderToStaticMarkup(
      <SignupsTable
        rows={rows}
        total={2}
        page={1}
        pageSize={25}
        pageCount={1}
        query={baseQuery}
        sources={['home']}
      />,
    )
    expect(html).toContain('mailto:jo@x.com')
    expect(html).toContain('tel:5551234')
    expect(html).toContain('sam@x.com')
    expect(html).toContain('unsubscribed')
    expect(html).toContain('Showing')
    expect(html).toContain('of ')
  })

  it('shows an empty state when there are no rows', () => {
    const html = renderToStaticMarkup(
      <SignupsTable
        rows={[]}
        total={0}
        page={1}
        pageSize={25}
        pageCount={1}
        query={baseQuery}
        sources={[]}
      />,
    )
    expect(html).toContain('No sign-ups match these filters.')
    expect(html).toContain('No results')
  })
})
