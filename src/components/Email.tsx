import { useState } from 'react'

export default function Email() {
  const [subscribed, setSubscribed] = useState(false)

  return (
    <section className="bg-yellow-400 text-blue-700 py-12 border-t-[3px] border-blue-700">
      <div className="max-w-[1240px] mx-auto px-5 md:px-7 grid md:grid-cols-[1fr_auto] gap-10 items-center">
        <div>
          <h2 className="display text-[36px] sm:text-[44px] md:text-[56px] m-0 mb-2">
            Special sales,
            <br />
            straight to your inbox.
          </h2>
          <p className="m-0 text-base font-semibold">
            Token discounts, seasonal promos, and the occasional free wash.
          </p>
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
            placeholder="you@example.com"
            required
            className="flex-1 outline-none px-4 py-2.5 text-[15px] bg-transparent text-ink rounded-full"
          />
          <button
            type="submit"
            className="bg-blue-700 text-white px-6 py-3 rounded-full font-extrabold text-sm hover:bg-blue-500 transition tracking-wide"
          >
            {subscribed ? 'Subscribed ✓' : 'Subscribe'}
          </button>
        </form>
      </div>
    </section>
  )
}
