import type { Metadata } from 'next'
import { Inter, Playfair_Display } from 'next/font/google'
import SiteHeader from '@/components/SiteHeader'
import { CartProvider } from '@/lib/cart'
import { WishlistProvider } from '@/lib/wishlist'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-avenya-sans' })
const playfair = Playfair_Display({ subsets: ['latin'], variable: '--font-avenya-display' })

export const metadata: Metadata = {
  title: 'House of Avenya - Timeless India, Reimagined',
  description: 'Discover luxury Indian-fusion fashion where heritage craftsmanship meets contemporary silhouette. House of Avenya - premium designer clothing for the modern soul.',
  keywords: 'luxury fashion, Indian fusion fashion, designer clothing, heritage craftsmanship, premium apparel, house of avenya',
  authors: [{ name: 'House of Avenya' }],
  creator: 'House of Avenya',
  publisher: 'House of Avenya',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://houseofavenya.com',
    title: 'House of Avenya - Timeless India, Reimagined',
    description: 'Discover luxury Indian-fusion fashion where heritage craftsmanship meets contemporary silhouette.',
    siteName: 'House of Avenya',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'House of Avenya - Timeless India, Reimagined',
    description: 'Discover luxury Indian-fusion fashion where heritage craftsmanship meets contemporary silhouette.',
    images: ['https://houseofavenya.com/og-image.jpg'],
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable} antialiased`}>
      <body className="font-sans">
        <CartProvider>
          <WishlistProvider>
            <SiteHeader />
            {children}
          </WishlistProvider>
        </CartProvider>
      </body>
    </html>
  )
}