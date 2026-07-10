'use client'

import { useState } from 'react'
import { updatePassword } from './actions'

type State = 'idle' | 'loading' | 'error'

const inputClass =
  'rounded-full border-2 border-line bg-white px-5 py-3 text-ink outline-none placeholder:text-slate-400 focus:border-blue-500'

export default function ResetForm({ submitLabel = 'Save new password' }: { submitLabel?: string }) {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [state, setState] = useState<State>('idle')
  const [message, setMessage] = useState('')

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (state === 'loading') return
    if (password.length < 8) {
      setState('error')
      setMessage('Password must be at least 8 characters.')
      return
    }
    if (password !== confirm) {
      setState('error')
      setMessage('Passwords don’t match.')
      return
    }
    setState('loading')
    setMessage('')
    try {
      const res = await updatePassword(password)
      if (res.ok) {
        // Full navigation so the middleware sees the refreshed session.
        window.location.assign('/admin/signups')
        return
      }
      setState('error')
      setMessage(res.message)
    } catch {
      setState('error')
      setMessage('Something went wrong. Please try again.')
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-3">
      <label htmlFor="new-password" className="sr-only">
        New password
      </label>
      <input
        id="new-password"
        type="password"
        autoComplete="new-password"
        required
        autoFocus
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="New password"
        aria-invalid={state === 'error'}
        className={inputClass}
      />
      <label htmlFor="confirm-password" className="sr-only">
        Confirm new password
      </label>
      <input
        id="confirm-password"
        type="password"
        autoComplete="new-password"
        required
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
        placeholder="Confirm new password"
        aria-invalid={state === 'error'}
        className={inputClass}
      />
      <button
        type="submit"
        disabled={state === 'loading'}
        className="rounded-full bg-blue-700 px-6 py-3 font-extrabold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {state === 'loading' ? 'Saving…' : submitLabel}
      </button>
      {state === 'error' && (
        <p className="text-sm font-bold text-red-600" role="alert">
          {message}
        </p>
      )}
    </form>
  )
}
