'use client'

import { useState } from 'react'
import { inviteAdmin } from './actions'

type State = 'idle' | 'loading' | 'error' | 'sent'

export default function InviteAdmin() {
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [state, setState] = useState<State>('idle')
  const [message, setMessage] = useState('')

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (state === 'loading') return
    setState('loading')
    setMessage('')
    try {
      const res = await inviteAdmin(email)
      if (res.ok) {
        setState('sent')
        setMessage(res.message)
        setEmail('')
      } else {
        setState('error')
        setMessage(res.message)
      }
    } catch {
      setState('error')
      setMessage('Something went wrong. Please try again.')
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-full border border-line px-4 py-2.5 text-sm font-bold text-blue-700 transition hover:border-blue-500"
      >
        Invite admin
      </button>
    )
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-1">
      <div className="flex items-center gap-2">
        <input
          type="email"
          required
          autoFocus
          value={email}
          onChange={(e) => {
            setEmail(e.target.value)
            if (state !== 'idle' && state !== 'loading') setState('idle')
          }}
          placeholder="new.admin@example.com"
          aria-invalid={state === 'error'}
          className="rounded-full border-2 border-line bg-white px-4 py-2 text-sm text-ink outline-none placeholder:text-slate-400 focus:border-blue-500"
        />
        <button
          type="submit"
          disabled={state === 'loading'}
          className="rounded-full bg-blue-700 px-4 py-2.5 text-sm font-extrabold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {state === 'loading' ? 'Sending…' : 'Send'}
        </button>
        <button
          type="button"
          onClick={() => {
            setOpen(false)
            setState('idle')
            setMessage('')
          }}
          className="rounded-full border border-line px-3 py-2.5 text-sm font-bold text-slate-500 transition hover:border-blue-500"
        >
          Cancel
        </button>
      </div>
      {message && (
        <p
          className={`px-1 text-xs font-bold ${state === 'error' ? 'text-red-600' : 'text-green-600'}`}
          role="alert"
        >
          {message}
        </p>
      )}
    </form>
  )
}
