import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'Terms governing use of the Spotless Carwash website and wash tokens.',
  alternates: { canonical: '/terms' },
}

export default function TermsPage() {
  return (
    <main className="bg-paper py-16 md:py-24">
      <article className="max-w-[760px] mx-auto px-5 md:px-7">
        <div className="inline-flex items-center gap-2 text-[11px] font-bold tracking-[0.22em] uppercase text-blue-500 mb-2.5">
          <span className="mono text-[#5b6987] font-medium">LEGAL /</span> Terms
        </div>
        <h1 className="display text-[44px] sm:text-[56px] md:text-[68px] m-0 leading-[1.05] mb-3">
          Terms of Service
        </h1>
        <p className="text-[#5b6987] text-sm m-0 mb-10">Last updated: May 2026</p>

        <div className="text-[#445273] leading-relaxed space-y-5 text-[16px]">
          <p>
            By using the Spotless Carwash website at spotlesscarwash.com, or by
            buying or redeeming wash tokens, you agree to these terms.
          </p>

          <h2 className="display text-[24px] mt-10 mb-2">Wash tokens</h2>
          <p>
            Spotless wash tokens are prepaid passes for one Ultimate touchless
            automatic wash each. Tokens never expire and work at both Forest Park
            locations (Roosevelt Rd and Madison St).
          </p>
          <p>
            Tokens are non-refundable and have no cash value. Lost or stolen
            tokens cannot be replaced. We reserve the right to refuse damaged or
            counterfeit tokens.
          </p>

          <h2 className="display text-[24px] mt-10 mb-2">Use of the bays</h2>
          <p>
            Customers use our automatic and self-serve bays at their own risk.
            Please follow posted signage, traffic-light signals, and any
            instructions from on-site attendants. Pull in only on a green light.
            We are not responsible for damage caused by failure to follow
            instructions, ignoring stop signals, or driving with loose roof
            cargo, antennas, or attachments.
          </p>

          <h2 className="display text-[24px] mt-10 mb-2">Damage claims</h2>
          <p>
            If you believe your vehicle was damaged at one of our facilities,
            please notify the on-duty attendant immediately, before leaving the
            lot, so we can document the situation. Claims raised after leaving
            the lot are difficult to verify and may not be honored.
          </p>

          <h2 className="display text-[24px] mt-10 mb-2">Hours and availability</h2>
          <p>
            Bays are open 7am–10pm daily but may close temporarily for
            maintenance, weather, or repairs. We do our best to post any closures
            on-site and on social media.
          </p>

          <h2 className="display text-[24px] mt-10 mb-2">Website content</h2>
          <p>
            Pricing, packages, and other website information are subject to
            change. We try to keep everything current but the on-site posted
            pricing at the wash is the authoritative source.
          </p>

          <h2 className="display text-[24px] mt-10 mb-2">Contact</h2>
          <p>
            Questions about these terms? Email{' '}
            <a
              href="mailto:info@spotlessautowash.com"
              className="text-blue-500 font-semibold underline"
            >
              info@spotlessautowash.com
            </a>{' '}
            or call <a href="tel:7087712945" className="text-blue-500 font-semibold underline">(708) 771-2945</a>.
          </p>
        </div>
      </article>
    </main>
  )
}
