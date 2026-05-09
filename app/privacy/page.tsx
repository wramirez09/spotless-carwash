import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'How Spotless Carwash collects, uses, and protects information from visitors and customers.',
  alternates: { canonical: '/privacy' },
}

export default function PrivacyPage() {
  return (
    <main className="bg-paper py-16 md:py-24">
      <article className="max-w-[760px] mx-auto px-5 md:px-7 prose prose-headings:display prose-headings:font-normal">
        <div className="inline-flex items-center gap-2 text-[11px] font-bold tracking-[0.22em] uppercase text-blue-500 mb-2.5">
          <span className="mono text-[#5b6987] font-medium">LEGAL /</span> Privacy
        </div>
        <h1 className="display text-[44px] sm:text-[56px] md:text-[68px] m-0 leading-[1.05] mb-3">
          Privacy Policy
        </h1>
        <p className="text-[#5b6987] text-sm m-0 mb-10">Last updated: May 2026</p>

        <div className="text-[#445273] leading-relaxed space-y-5 text-[16px]">
          <p>
            This privacy policy describes how Spotless Carwash (&ldquo;we,&rdquo; &ldquo;us&rdquo;)
            collects and uses information when you visit our website at
            spotlesscarwash.com or our two locations in Forest Park, IL.
          </p>

          <h2 className="display text-[24px] mt-10 mb-2">What we collect</h2>
          <p>
            <strong>Email addresses</strong> when you subscribe to our newsletter.
            We use this only to send the discounts, seasonal promos, and occasional
            free wash codes described at signup. You can unsubscribe at any time
            using the link in any email.
          </p>
          <p>
            <strong>Token purchase information</strong> when you buy wash tokens
            online. Payment is processed by our third-party payment provider
            (currently PayPal). We do not store your full card or payment account
            details on this site.
          </p>
          <p>
            <strong>Standard analytics</strong> like pages visited and approximate
            location (country/city), gathered from server logs and any analytics
            tools we run. We use this only to understand how the site is used and
            improve it.
          </p>

          <h2 className="display text-[24px] mt-10 mb-2">What we don&apos;t do</h2>
          <p>
            We do not sell your information to third parties. We do not share your
            email address with anyone outside our newsletter delivery service. We
            do not track you across other websites.
          </p>

          <h2 className="display text-[24px] mt-10 mb-2">Cookies</h2>
          <p>
            This site uses standard cookies for session handling and any analytics
            tools we run. You can disable cookies in your browser settings; the
            site will still work, though some features may be limited.
          </p>

          <h2 className="display text-[24px] mt-10 mb-2">Your rights</h2>
          <p>
            You can ask us to delete the email address and any other information
            we hold about you at any time. Email{' '}
            <a
              href="mailto:hello@spotlesscarwash.com"
              className="text-blue-500 font-semibold underline"
            >
              hello@spotlesscarwash.com
            </a>{' '}
            and we&apos;ll take care of it within a reasonable timeframe.
          </p>

          <h2 className="display text-[24px] mt-10 mb-2">Updates</h2>
          <p>
            We may update this policy from time to time. The &ldquo;last updated&rdquo;
            date at the top will reflect any changes.
          </p>

          <h2 className="display text-[24px] mt-10 mb-2">Contact</h2>
          <p>
            Questions? Email{' '}
            <a
              href="mailto:hello@spotlesscarwash.com"
              className="text-blue-500 font-semibold underline"
            >
              hello@spotlesscarwash.com
            </a>{' '}
            or call <a href="tel:7087712945" className="text-blue-500 font-semibold underline">(708) 771-2945</a>.
          </p>
        </div>
      </article>
    </main>
  )
}
