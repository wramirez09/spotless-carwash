'use client'

import { useState } from 'react'

type State = 'idle' | 'loading' | 'confirm' | 'done' | 'error'
type Outcome = 'subscribed' | 'resubscribed' | 'already_subscribed' | 'confirm_resubscribe'
type TerminalOutcome = Exclude<Outcome, 'confirm_resubscribe'>

type SubscribeResponse = {
  ok?: boolean
  error?: string
  outcome?: Outcome
  message?: string
}

// Context-rich confirmations for the maintenance page.
const DONE_MESSAGE: Record<TerminalOutcome, string> = {
  subscribed:
    "You're on the list — we'll email you the moment we relaunch with the latest from Spotless.",
  resubscribed: "Welcome back — you're on the list again.",
  already_subscribed: "You're already on our list — thanks!",
}

const inputClass =
  'flex-1 rounded-full bg-white px-5 py-3.5 text-blue-950 font-semibold placeholder:text-slate-400 outline-none ring-2 ring-transparent focus:ring-yellow-400 transition'

export default function PromotionSignup() {
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [state, setState] = useState<State>('idle')
  const [outcome, setOutcome] = useState<TerminalOutcome>('subscribed')
  const [message, setMessage] = useState('')

  async function submit(confirmResubscribe = false) {
    setState('loading')
    setMessage('')
    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          name: name.trim() || undefined,
          phone: phone.trim() || undefined,
          source: 'under_construction',
          confirmResubscribe,
        }),
      })
      const data = (await res.json().catch(() => ({}))) as SubscribeResponse
      if (!res.ok) {
        setState('error')
        setMessage(data.error || 'Something went wrong. Please try again.')
        return
      }
      const result = data.outcome ?? 'subscribed'
      if (result === 'confirm_resubscribe') {
        setState('confirm')
        setMessage(data.message || 'You previously unsubscribed. Want to resubscribe?')
        return
      }
      setOutcome(result)
      setState('done')
    } catch {
      setState('error')
      setMessage('Network error. Please try again.')
    }
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (state === 'loading') return
    submit(false)
  }

  return (
    <section className="mt-10 rounded-[32px] border border-white/20 bg-white/10 p-6 sm:p-7 shadow-[0_35px_70px_-35px_rgba(0,0,0,0.35)] backdrop-blur-sm text-left">
      <div className="max-w-[980px] mx-auto">
        <p className="text-xs uppercase tracking-[0.26em] text-[#cfe0ff]">Stay in the loop</p>
        <p className="mt-1 text-xl font-black text-white">Get relaunch news &amp; updates</p>

        {state === 'done' ? (
          <div
            className="mt-5 flex items-center gap-3 rounded-2xl border border-yellow-400/40 bg-yellow-400/10 px-5 py-4"
            role="status"
            aria-live="polite"
          >
            <svg
              className="w-6 h-6 flex-shrink-0 text-yellow-400"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <path d="M20 6L9 17l-5-5" />
            </svg>
            <p className="text-sm sm:text-base font-bold text-white">{DONE_MESSAGE[outcome]}</p>
          </div>
        ) : (
          <>
            <form onSubmit={onSubmit} className="mt-5 flex flex-col gap-3" noValidate>
              {/* Optional details — name + phone */}
              <div className="flex flex-col sm:flex-row gap-3">
                <label htmlFor="promo-name" className="sr-only">
                  Name (optional)
                </label>
                <input
                  id="promo-name"
                  type="text"
                  name="name"
                  autoComplete="name"
                  placeholder="Name (optional)"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={inputClass}
                />
                <label htmlFor="promo-phone" className="sr-only">
                  Phone (optional)
                </label>
                <input
                  id="promo-phone"
                  type="tel"
                  name="phone"
                  inputMode="tel"
                  autoComplete="tel"
                  placeholder="Phone (optional)"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className={inputClass}
                />
              </div>
              {/* Required — email + submit */}
              <div className="flex flex-col sm:flex-row gap-3">
                <label htmlFor="promo-email" className="sr-only">
                  Email address
                </label>
                <input
                  id="promo-email"
                  type="email"
                  name="email"
                  inputMode="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@email.com"
                  aria-invalid={state === 'error'}
                  className={inputClass}
                />
                <button
                  type="submit"
                  disabled={state === 'loading'}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-yellow-400 px-7 py-3.5 text-blue-950 font-extrabold shadow-lg shadow-yellow-400/20 transition hover:bg-yellow-300 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {state === 'loading' ? 'Joining…' : 'Notify me'}
                </button>
              </div>
            </form>

            {state === 'confirm' && (
              <div className="mt-3 flex flex-col sm:flex-row sm:items-center gap-3" role="status">
                <p className="text-sm font-semibold text-white">{message}</p>
                <button
                  type="button"
                  onClick={() => submit(true)}
                  className="self-start rounded-full bg-yellow-400 px-6 py-2.5 text-blue-950 font-extrabold hover:bg-yellow-300 transition"
                >
                  Yes, resubscribe
                </button>
              </div>
            )}

            {state === 'error' && (
              <p className="mt-3 text-sm font-semibold text-yellow-300" role="alert">
                {message}
              </p>
            )}
            <p className="mt-3 text-[12px] text-[#9bb6ff]">
              No spam — just relaunch news and updates. Unsubscribe anytime.
            </p>
          </>
        )}
      </div>
    </section>
  )
}
