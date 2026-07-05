'use client'

import { useState } from 'react'
import { requestMagicLink, signInWithPassword, requestPasswordReset } from './actions'

type Mode = 'password' | 'magic' | 'reset'
type State = 'idle' | 'loading' | 'sent' | 'error'

const inputClass =
  'rounded-full border-2 border-line bg-white px-5 py-3 text-ink outline-none placeholder:text-slate-400 focus:border-blue-500'

export default function LoginForm({ next, notConfigured }: { next?: string; notConfigured?: boolean }) {
  const [mode, setMode] = useState<Mode>('password')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [state, setState] = useState<State>('idle')
  const [message, setMessage] = useState('')

  function switchMode(nextMode: Mode) {
    setMode(nextMode)
    setState('idle')
    setMessage('')
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (state === 'loading') return
    setState('loading')
    setMessage('')
    try {
      if (mode === 'password') {
        const res = await signInWithPassword(email, password, next)
        if (res.ok) {
          // Full navigation so the middleware picks up the new session cookie.
          window.location.assign(res.redirectTo)
          return
        }
        setState('error')
        setMessage(res.message)
        return
      }

      const res =
        mode === 'reset' ? await requestPasswordReset(email) : await requestMagicLink(email, next)
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
          onClick={() => switchMode('password')}
          className="mt-3 text-xs font-bold text-blue-500 underline"
        >
          Back to sign in
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-3">
      {mode === 'reset' && (
        <p className="-mt-1 text-sm text-slate-500">
          Enter your admin email and we&apos;ll send a password-reset link.
        </p>
      )}
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
        className={inputClass}
      />

      {mode === 'password' && (
        <>
          <label htmlFor="admin-password" className="sr-only">
            Password
          </label>
          <input
            id="admin-password"
            type="password"
            name="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            aria-invalid={state === 'error'}
            className={inputClass}
          />
        </>
      )}

      <button
        type="submit"
        disabled={state === 'loading' || notConfigured}
        className="rounded-full bg-blue-700 px-6 py-3 font-extrabold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {state === 'loading'
          ? mode === 'password'
            ? 'Signing in…'
            : 'Sending…'
          : mode === 'password'
            ? 'Sign in'
            : mode === 'reset'
              ? 'Send reset link'
              : 'Email me a sign-in link'}
      </button>

      {!notConfigured && (
        <div className="flex flex-col items-center gap-1.5">
          {mode === 'password' && (
            <>
              <button
                type="button"
                onClick={() => switchMode('reset')}
                className="text-xs font-bold text-blue-500 underline"
              >
                Forgot password?
              </button>
              <button
                type="button"
                onClick={() => switchMode('magic')}
                className="text-xs font-bold text-blue-500 underline"
              >
                Email me a sign-in link instead
              </button>
            </>
          )}
          {mode === 'magic' && (
            <button
              type="button"
              onClick={() => switchMode('password')}
              className="text-xs font-bold text-blue-500 underline"
            >
              Sign in with a password instead
            </button>
          )}
          {mode === 'reset' && (
            <button
              type="button"
              onClick={() => switchMode('password')}
              className="text-xs font-bold text-blue-500 underline"
            >
              Back to sign in
            </button>
          )}
        </div>
      )}

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
