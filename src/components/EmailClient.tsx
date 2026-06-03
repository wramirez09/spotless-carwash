'use client'

import { useState } from 'react'

export type EmailData = {
  headlineLine1: string
  headlineLine2: string
  body: string
  placeholder: string
  submitLabel: string
  successLabel: string
}

type State = 'idle' | 'loading' | 'done' | 'error'

export default function EmailClient({ data }: { data: EmailData }) {
  const [email, setEmail] = useState('')
  const [state, setState] = useState<State>('idle')
  const [message, setMessage] = useState('')

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (state === 'loading' || state === 'done') return
    setState('loading')
    setMessage('')
    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, source: 'home' }),
      })
      const body = (await res.json().catch(() => ({}))) as { error?: string }
      if (!res.ok) {
        setState('error')
        setMessage(body.error || 'Something went wrong. Please try again.')
        return
      }
      setState('done')
    } catch {
      setState('error')
      setMessage('Network error. Please try again.')
    }
  }

  const done = state === 'done'

  return (
    <section className="bg-yellow-400 text-blue-700 py-12 border-t-[3px] border-blue-700">
      <div className="max-w-[1240px] mx-auto px-5 md:px-7 grid md:grid-cols-[1fr_auto] gap-10 items-center">
        <div>
          <h2 className="display text-[36px] sm:text-[44px] md:text-[56px] m-0 mb-2">
            {data.headlineLine1}
            <br />
            {data.headlineLine2}
          </h2>
          <p className="m-0 text-base font-semibold">{data.body}</p>
        </div>
        <div>
          <form
            onSubmit={onSubmit}
            noValidate
            className="flex flex-col sm:flex-row gap-2 bg-white p-2 rounded-3xl sm:rounded-full sm:min-w-[380px] border-2 border-blue-700"
          >
            <label htmlFor="home-email" className="sr-only">
              Email address
            </label>
            <input
              id="home-email"
              type="email"
              name="email"
              inputMode="email"
              autoComplete="email"
              placeholder={data.placeholder}
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={done}
              aria-invalid={state === 'error'}
              className="flex-1 outline-none px-4 py-2.5 text-[15px] bg-transparent text-ink rounded-full disabled:opacity-60"
            />
            <button
              type="submit"
              disabled={state === 'loading' || done}
              className="bg-blue-700 text-white px-6 py-3 rounded-full font-extrabold text-sm hover:bg-blue-500 transition tracking-wide disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {done ? data.successLabel : state === 'loading' ? 'Sending…' : data.submitLabel}
            </button>
          </form>
          {state === 'error' && (
            <p className="mt-2 text-sm font-bold text-blue-700" role="alert">
              {message}
            </p>
          )}
        </div>
      </div>
    </section>
  )
}
