import type { Metadata } from 'next';
import PageIntro from '@/components/PageIntro';
import LegalBody from '@/components/LegalBody';
import Newsletter from '@/components/Newsletter';
import Footer from '@/components/Footer';

export const metadata: Metadata = {
  title: 'Privacy Policy — House of Avenya',
  description: 'How House of Avenya collects, uses and protects your personal information.',
};

const SECTIONS = [
  {
    heading: 'Information We Collect',
    paragraphs: [
      'We collect only the information you choose to give us. When you subscribe to our newsletter, we record the email address you enter so we can send you the notes you asked for.',
      'We do not sell, rent or trade your personal information under any circumstances.',
    ],
  },
  {
    heading: 'How We Use Your Information',
    points: [
      'To send you collection previews and atelier notes you have explicitly subscribed to.',
      'To respond to any enquiry you send us.',
      'To understand, in aggregate, how the site is used so we can improve it.',
    ],
  },
  {
    heading: 'Cookies',
    paragraphs: [
      'This site uses only the cookies required for the site to function. We do not use advertising cookies or cross-site tracking.',
    ],
  },
  {
    heading: 'Your Rights',
    paragraphs: [
      'You may ask us at any time to show you the information we hold about you, to correct it, or to delete it. To make that request, use the contact details on our Contact page.',
    ],
  },
  {
    heading: 'Changes To This Policy',
    paragraphs: [
      'If we revise this policy we will update the date at the top of this page. Continuing to use the site after a change means you accept the revised policy.',
    ],
  },
];

export default function PrivacyPage() {
  return (
    <>
      <main className="min-h-screen overflow-x-clip">
        <PageIntro
          eyebrow="The Fine Print"
          title="Privacy Policy"
          description="We keep our data handling as considered as our designs. Here is exactly what we collect and why."
        />

        <LegalBody
          updated="September 2026"
          intro="Your privacy matters to us. This policy explains what we collect, why we collect it, and the control you have over it."
          sections={SECTIONS}
        />

        <Newsletter />
      </main>

      <Footer />
    </>
  );
}
