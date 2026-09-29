import type { Metadata } from 'next';
import PageIntro from '@/components/PageIntro';
import LegalBody from '@/components/LegalBody';
import Newsletter from '@/components/Newsletter';
import Footer from '@/components/Footer';

export const metadata: Metadata = {
  title: 'Terms — House of Avenya',
  description: 'The terms that govern your use of the House of Avenya website.',
};

const SECTIONS = [
  {
    heading: 'Using This Site',
    paragraphs: [
      'By using this site you agree to these terms. If you do not agree with them, please stop using the site.',
    ],
  },
  {
    heading: 'Product Information',
    paragraphs: [
      'We work hard to represent our pieces accurately, but screens vary and hand-finished garments differ slightly from one another. Natural variation in fabric, dye and embroidery is a feature of the craft, not a fault.',
    ],
  },
  {
    heading: 'Prices And Availability',
    paragraphs: [
      'Prices are shown in Indian Rupees and include applicable taxes. Because we produce in small runs, a piece may sell out or be withdrawn. If an order cannot be fulfilled we will contact you and refund in full.',
    ],
  },
  {
    heading: 'Intellectual Property',
    paragraphs: [
      'All imagery, text, designs and the House of Avenya name are our property. You may browse and share links to this site, but you may not reproduce our work commercially without written permission.',
    ],
  },
  {
    heading: 'Limitation Of Liability',
    paragraphs: [
      'We provide this site as it is. To the extent permitted by law, we are not liable for losses arising from its use. Nothing here limits your statutory consumer rights.',
    ],
  },
  {
    heading: 'Governing Law',
    paragraphs: [
      'These terms are governed by the laws of India, and the courts of India have jurisdiction over any dispute.',
    ],
  },
];

export default function TermsPage() {
  return (
    <>
      <main className="min-h-screen overflow-x-clip">
        <PageIntro
          eyebrow="The Fine Print"
          title="Terms"
          description="The straightforward rules that govern your use of this site and your relationship with House of Avenya."
        />

        <LegalBody
          updated="September 2026"
          intro="These terms set out the agreement between you and House of Avenya when you use this website."
          sections={SECTIONS}
        />

        <Newsletter />
      </main>

      <Footer />
    </>
  );
}
