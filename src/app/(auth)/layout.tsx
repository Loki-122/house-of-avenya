import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: {
    default: 'Account — House of Avenya',
    template: '%s — House of Avenya',
  },
  robots: { index: false, follow: false },
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
