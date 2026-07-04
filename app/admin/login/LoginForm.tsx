'use client'

import { useState } from 'react'
import { requestMagicLink } from './actions'

type State = 'idle' | 'loading' | 'sent' | 'error'

export default function LoginForm({ next, notConfigured }: { next?: string; notConfigured?: boolean }) {
  const [email, setEmail] = useState('')
  const [state, setState] = useState<State>('idle')
  const [message, setMessage] = useState('')

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (state === 'loading') return
    setState('loading')
    setMessage('')
    try {
      const res = await requestMagicLink(email, next)
      if (res.ok) {
        setState('sent')
        setMessage(res.message)
      } else {
        setState('error')
        setMessage(res.message)
      }
    } catch {
      setState('error')
      setMessage('Something went wrong. Please try again.')
    }
  }

  if (state === 'sent') {
    return (
      <div
        className="rounded-2xl border border-yellow-400/50 bg-yellow-400/10 px-5 py-4 text-center"
        role="status"
        aria-live="polite"
      >
        <p className="text-sm font-bold text-ink">{message}</p>
        <button
          type="button"
          onClick={() => setState('idle')}
          className="mt-3 text-xs font-bold text-blue-500 underline"
        >
          Use a different email
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-3">
      <label htmlFor="admin-email" className="sr-only">
        Email address
      </label>
      <input
        id="admin-email"
        type="email"
        name="email"
        inputMode="email"
        autoComplete="email"
        required
        autoFocus
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@email.com"
        aria-invalid={state === 'error'}
        className="rounded-full border-2 border-line bg-white px-5 py-3 text-ink outline-none placeholder:text-slate-400 focus:border-blue-500"
      />
      <button
        type="submit"
        disabled={state === 'loading' || notConfigured}
        className="rounded-full bg-blue-700 px-6 py-3 font-extrabold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {state === 'loading' ? 'Sending…' : 'Email me a sign-in link'}
      </button>

      {notConfigured && (
        <p className="text-xs font-semibold text-slate-400" role="note">
          Sign-in isn&apos;t configured for this environment yet.
        </p>
      )}
      {state === 'error' && (
        <p className="text-sm font-bold text-red-600" role="alert">
          {message}
        </p>
      )}
    </form>
  )
}
