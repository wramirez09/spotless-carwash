'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { locations, directionsUrl, fullAddress } from '@/src/data/locations'
import type { ImageWithAlt } from '@/lib/sanityImage'
import SanityImage from './SanityImage'

type NavLink = { label: string; href: string; external?: boolean }

export type NavData = {
  logo?: ImageWithAlt | null
  sectionLinks: NavLink[]
  pageLinks: NavLink[]
  paypalUrl: string
  phone: string
  phoneHref: string
  email: string
  hoursLine: string
  buyTokensLabel: string
}

export default function NavClient({ data }: { data: NavData }) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname() ?? ''
  const isActive = (href: string) => {
    if (!href || href.startsWith('/#') || href.startsWith('#')) return false
    return pathname === href || pathname.startsWith(href + '/')
  }

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  const close = () => setOpen(false)

  return (
    <nav className="sticky top-0 z-50 bg-blue-500 text-white border-b-[3px] border-blue-700">
      <div className="max-w-[1240px] mx-auto flex items-center gap-4 md:gap-6 px-5 md:px-7 py-3.5">
        <Link href="/" onClick={close} className="leading-none">
          {data.logo?.asset?._ref ? (
            <SanityImage
              image={data.logo}
              width={220}
              height={64}
              priority
              className="h-12 md:h-14 w-auto"
            />
          ) : (
            <span className="display italic uppercase text-white text-[22px] [text-shadow:-0.035em_0.05em_0_#0a2a6b]">
              <span className="text-[35px]">S</span>POTLESS
              <div className="pl-[1em]">CARWASH</div>
            </span>
          )}
        </Link>

        <div className="ml-auto hidden md:flex flex-wrap gap-1.5">
          {data.sectionLinks.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="px-3.5 py-2 rounded-full font-semibold text-sm text-blue-100 hover:bg-white/10 hover:text-white transition"
            >
              {l.label}
            </Link>
          ))}
          {data.pageLinks.map((l) => {
            const active = isActive(l.href)
            return (
              <Link
                key={l.href}
                href={l.href}
                aria-current={active ? 'page' : undefined}
                className={
                  'px-3.5 py-2 rounded-full font-semibold text-sm transition ' +
                  (active
                    ? 'bg-white/10 text-white'
                    : 'text-blue-100 hover:bg-white/10 hover:text-white')
                }
              >
                {l.label}
              </Link>
            )
          })}
        </div>

        <a
          href={data.paypalUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="ml-auto md:ml-0 bg-yellow-400 text-blue-700 px-4 py-2.5 rounded-full font-extrabold text-sm hover:bg-white transition"
        >
          {data.buyTokensLabel}
        </a>

        <button
          type="button"
          onClick={() => setOpen((x) => !x)}
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
          aria-controls="mobile-menu"
          className="md:hidden w-10 h-10 -mr-1 flex items-center justify-center rounded-full hover:bg-white/10 transition"
        >
          {open ? (
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          ) : (
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M4 7h16M4 12h16M4 17h16" />
            </svg>
          )}
        </button>
      </div>

      {open && (
        <div
          className="md:hidden fixed inset-0 top-[64px] bg-blue-500/40 backdrop-blur-sm z-40"
          onClick={close}
          aria-hidden
        />
      )}

      <div
        id="mobile-menu"
        className={
          'md:hidden absolute left-0 right-0 top-full bg-blue-700 border-b-[3px] border-blue-700 shadow-[0_24px_60px_rgba(8,24,63,.45)] z-50 overflow-y-auto max-h-[calc(100vh-64px)] transition-all duration-200 ease-out ' +
          (open
            ? 'opacity-100 translate-y-0 pointer-events-auto'
            : 'opacity-0 -translate-y-2 pointer-events-none')
        }
      >
        <div className="px-5 py-6 flex flex-col gap-6">
          <div className="flex flex-col">
            <div className="text-[11px] font-bold tracking-[0.22em] uppercase text-blue-200 mb-3">
              Browse
            </div>
            {data.sectionLinks.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={close}
                className="py-3 border-b border-white/10 font-semibold text-white hover:text-yellow-400 transition"
              >
                {l.label}
              </Link>
            ))}
            {data.pageLinks.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={close}
                className="py-3 border-b border-white/10 font-semibold text-white hover:text-yellow-400 transition"
              >
                {l.label}
              </Link>
            ))}
          </div>

          <div className="flex flex-col gap-3">
            <div className="text-[11px] font-bold tracking-[0.22em] uppercase text-blue-200">
              Locations
            </div>
            {locations.map((loc) => (
              <div key={loc.slug} className="bg-white/5 border border-white/10 rounded-2xl p-4">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <Link
                    href={`/locations/${loc.slug}`}
                    onClick={close}
                    className="display text-[22px] text-white"
                  >
                    {loc.name}
                  </Link>
                </div>
                <div className="text-blue-100 text-sm leading-snug mb-3">{fullAddress(loc)}</div>
                <div className="flex gap-2">
                  <a
                    href={directionsUrl(loc)}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={close}
                    className="flex-1 text-center py-2.5 rounded-full text-xs font-extrabold bg-yellow-400 text-blue-700 hover:bg-white transition"
                  >
                    Directions
                  </a>
                  <a
                    href={loc.phoneHref}
                    onClick={close}
                    className="flex-1 text-center py-2.5 rounded-full text-xs font-extrabold border border-white/40 text-white hover:bg-white/10 transition"
                  >
                    Call
                  </a>
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-2">
            <div className="text-[11px] font-bold tracking-[0.22em] uppercase text-blue-200">
              Contact
            </div>
            <a
              href={data.phoneHref}
              onClick={close}
              className="text-white font-semibold hover:text-yellow-400 transition"
            >
              {data.phone}
            </a>
            <a
              href={`mailto:${data.email}`}
              onClick={close}
              className="text-white font-semibold hover:text-yellow-400 transition break-all"
            >
              {data.email}
            </a>
            <div className="text-blue-200 text-sm">{data.hoursLine}</div>
          </div>

          <a
            href={data.paypalUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={close}
            className="bg-yellow-400 text-blue-700 text-center py-3.5 rounded-full font-extrabold text-sm hover:bg-white transition"
          >
            {data.buyTokensLabel}
          </a>
        </div>
      </div>
    </nav>
  )
}
