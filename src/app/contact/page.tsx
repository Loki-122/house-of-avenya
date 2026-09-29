import type { Metadata } from 'next';
import PageIntro from '@/components/PageIntro';
import Newsletter from '@/components/Newsletter';
import Footer from '@/components/Footer';

export const metadata: Metadata = {
  title: 'Contact — House of Avenya',
  description: 'Reach the House of Avenya atelier for styling advice, order questions or press enquiries.',
};

const CHANNELS = [
  {
    label: 'Email',
    value: 'hello@houseofavenya.com',
    href: 'mailto:hello@houseofavenya.com',
    note: 'For styling advice, order questions and everything else.',
  },
  {
    label: 'Atelier',
    value: 'Mumbai, India',
    href: null,
    note: 'Collections are shown by appointment in our studio.',
  },
  {
    label: 'Hours',
    value: 'Monday to Saturday, 10am to 6pm IST',
    href: null,
    note: 'We reply to every message within two working days.',
  },
];

export default function ContactPage() {
  return (
    <>
      <main className="min-h-screen overflow-x-clip">
        <PageIntro
          eyebrow="We'd Love To Hear From You"
          title="Contact"
          description="Questions about a piece, an order, or a collaboration — reach the atelier directly and a person will reply."
        />

        <section aria-labelledby="contact-details-heading" className="bg-brand-ivory px-5 py-20 sm:px-8 md:py-28">
          <div className="mx-auto grid max-w-7xl gap-14 lg:grid-cols-12 lg:gap-16">
            <div className="lg:col-span-5">
              <p className="flex items-center gap-4 font-sans text-[0.625rem] uppercase tracking-[0.45em] text-brand-espresso/70">
                <span aria-hidden="true" className="h-px w-10 bg-brand-antiqueGold" />
                Get In Touch
              </p>

              <h2
                id="contact-details-heading"
                className="mt-6 font-display text-[clamp(1.875rem,4vw,3rem)] font-light uppercase leading-[1.08] tracking-[-0.01em] text-brand-espresso"
              >
                Talk To
                <br />
                The <span className="text-brand-terracotta">Atelier</span>
              </h2>

              <p className="mt-6 max-w-md font-sans text-editorial-sm leading-relaxed text-brand-espresso/75">
                We are a small team, so every message is read by someone who works with the pieces themselves.
                Whether you are unsure about sizing or searching for something for a wedding, we are glad to help.
              </p>
            </div>

            <div className="lg:col-span-7">
              <dl className="flex flex-col">
                {CHANNELS.map((channel) => (
                  <div key={channel.label} className="border-t border-brand-antiqueGold/30 py-7 first:border-t-0 first:pt-0">
                    <dt className="font-sans text-[0.625rem] uppercase tracking-[0.35em] text-brand-antiqueGoldDark">
                      {channel.label}
                    </dt>
                    <dd className="mt-3">
                      {channel.href ? (
                        <a
                          href={channel.href}
                          className="group inline-flex items-center gap-3 font-display text-xl uppercase tracking-[0.04em] text-brand-espresso transition-colors duration-300 hover:text-brand-terracotta sm:text-2xl"
                        >
                          {channel.value}
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            aria-hidden="true"
                            className="transition-transform duration-300 group-hover:translate-x-1"
                          >
                            <line x1="4" y1="12" x2="20" y2="12" />
                            <polyline points="13 5 20 12 13 19" />
                          </svg>
                        </a>
                      ) : (
                        <span className="font-display text-xl uppercase tracking-[0.04em] text-brand-espresso sm:text-2xl">
                          {channel.value}
                        </span>
                      )}
                      <p className="mt-2 font-sans text-sm leading-relaxed text-brand-espresso/65">
                        {channel.note}
                      </p>
                    </dd>
                  </div>
                ))}
              </dl>

              <p className="mt-8 border-t border-brand-antiqueGold/30 pt-6 font-sans text-sm leading-relaxed text-brand-espresso/60">
                Contact details shown here are placeholders for the studio. An enquiry form has not been connected
                yet, so please use the email address above.
              </p>
            </div>
          </div>
        </section>

        <Newsletter />
      </main>

      <Footer />
    </>
  );
}
