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

type State = 'idle' | 'loading' | 'confirm' | 'done' | 'error'
type Outcome = 'subscribed' | 'resubscribed' | 'already_subscribed' | 'confirm_resubscribe'

type SubscribeResponse = {
  ok?: boolean
  error?: string
  outcome?: Outcome
  message?: string
}

export default function EmailClient({ data }: { data: EmailData }) {
  const [email, setEmail] = useState('')
  const [state, setState] = useState<State>('idle')
  const [outcome, setOutcome] = useState<Outcome | null>(null)
  const [message, setMessage] = useState('')

  async function submit(confirmResubscribe = false) {
    setState('loading')
    setMessage('')
    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, source: 'home', confirmResubscribe }),
      })
      const body = (await res.json().catch(() => ({}))) as SubscribeResponse
      if (!res.ok) {
        setState('error')
        setMessage(body.error || 'Something went wrong. Please try again.')
        return
      }
      const result = body.outcome ?? 'subscribed'
      setOutcome(result)
      setMessage(body.message || '')
      // Previously unsubscribed — hold for an explicit confirmation click.
      setState(result === 'confirm_resubscribe' ? 'confirm' : 'done')
    } catch {
      setState('error')
      setMessage('Network error. Please try again.')
    }
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (state === 'loading' || state === 'done') return
    submit(false)
  }

  const done = state === 'done'
  const buttonLabel = done
    ? outcome === 'already_subscribed'
      ? 'Already on the list ✓'
      : data.successLabel
    : state === 'loading'
      ? 'Sending…'
      : data.submitLabel

  return (
    <section className="bg-yellow-400 text-blue-700 py-12 border-t-[3px] border-blue-700">
      <div className="max-w-[1240px] mx-auto px-5 md:px-7 grid md:grid-cols-[1fr_auto] gap-10 items-center">
        <div className="max-w-[650px]">
          <h2 className="display text-[36px] sm:text-[44px] md:text-[56px] m-0 mb-2">
            {data.headlineLine1}
            <br />
            {data.headlineLine2}
          </h2>
          <p className="m-0 mt-3 text-base font-semibold">{data.body}</p>
        </div>
        <div>
          <form
            onSubmit={onSubmit}
            noValidate
            className="flex flex-col sm:flex-row gap-2 bg-white p-2 rounded-3xl sm:rounded-full sm:min-w-[480px] border-2 border-blue-700"
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
              className="flex-1 outline-none px-4 py-2.5 text-[15px] bg-transparent text-ink placeholder:text-slate-400 rounded-full disabled:opacity-60"
            />
            <button
              type="submit"
              disabled={state === 'loading' || done}
              className="bg-blue-700 text-white px-6 py-3 rounded-full font-extrabold text-sm hover:bg-blue-500 transition tracking-wide disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {buttonLabel}
            </button>
          </form>

          {state === 'confirm' && (
            <div className="mt-2 flex flex-col sm:flex-row sm:items-center gap-2" role="status">
              <p className="text-sm font-bold text-blue-700">{message}</p>
              <button
                type="button"
                onClick={() => submit(true)}
                className="self-start sm:self-auto bg-blue-700 text-white px-5 py-2 rounded-full font-extrabold text-sm hover:bg-blue-500 transition"
              >
                Yes, resubscribe
              </button>
            </div>
          )}

          {(state === 'error' || (done && message)) && (
            <p
              className="mt-2 text-sm font-bold text-blue-700"
              role={state === 'error' ? 'alert' : 'status'}
            >
              {message}
            </p>
          )}
        </div>
      </div>
    </section>
  )
}
