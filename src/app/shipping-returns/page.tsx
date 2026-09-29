import type { Metadata } from 'next';
import PageIntro from '@/components/PageIntro';
import LegalBody from '@/components/LegalBody';
import Newsletter from '@/components/Newsletter';
import Footer from '@/components/Footer';

export const metadata: Metadata = {
  title: 'Shipping & Returns — House of Avenya',
  description: 'How your House of Avenya order is dispatched, and our returns policy.',
};

const SECTIONS = [
  {
    heading: 'Dispatch',
    paragraphs: [
      'Every order is packed by hand at our atelier, so please allow two to three working days before dispatch. You will receive a confirmation as soon as your piece leaves us.',
    ],
  },
  {
    heading: 'Delivery',
    points: [
      'India — standard delivery in 3 to 5 working days; express delivery in 1 to 2 working days.',
      'International — delivery typically takes 7 to 12 working days, depending on destination.',
      'Any duties or import taxes payable on arrival are the responsibility of the recipient.',
    ],
  },
  {
    heading: 'Returns',
    paragraphs: [
      'If a piece is not right for you, tell us within 14 days of delivery and we will arrange a return.',
      'For hygiene reasons we cannot accept returns on worn earrings or altered garments. Faulty pieces are always replaced or refunded in full, and we cover the return postage.',
    ],
  },
  {
    heading: 'Refunds',
    paragraphs: [
      'Once a return reaches us, we inspect the piece and issue your refund to the original payment method. Please allow 5 to 7 working days for the amount to appear.',
    ],
  },
  {
    heading: 'Need Help?',
    paragraphs: [
      'If anything about your order is unclear, get in touch through our Contact page and we will sort it out.',
    ],
  },
];

export default function ShippingReturnsPage() {
  return (
    <>
      <main className="min-h-screen overflow-x-clip">
        <PageIntro
          eyebrow="Care & Orders"
          title="Shipping / Returns"
          description="How your order travels from our atelier to you, and what happens if it is not quite right."
        />

        <LegalBody
          updated="September 2026"
          intro="We pack every order by hand. Below is everything you need to know about delivery and returns."
          sections={SECTIONS}
        />

        <Newsletter />
      </main>

      <Footer />
    </>
  );
}
