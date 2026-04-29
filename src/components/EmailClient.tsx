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

export default function EmailClient({ data }: { data: EmailData }) {
  const [subscribed, setSubscribed] = useState(false)

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
        <form
          onSubmit={(e) => {
            e.preventDefault()
            setSubscribed(true)
          }}
          className="flex flex-col sm:flex-row gap-2 bg-white p-2 rounded-3xl sm:rounded-full sm:min-w-[380px] border-2 border-blue-700"
        >
          <input
            type="email"
            placeholder={data.placeholder}
            required
            className="flex-1 outline-none px-4 py-2.5 text-[15px] bg-transparent text-ink rounded-full"
          />
          <button
            type="submit"
            className="bg-blue-700 text-white px-6 py-3 rounded-full font-extrabold text-sm hover:bg-blue-500 transition tracking-wide"
          >
            {subscribed ? data.successLabel : data.submitLabel}
          </button>
        </form>
      </div>
    </section>
  )
}
