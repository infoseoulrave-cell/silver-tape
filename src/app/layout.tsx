import type { Metadata } from 'next';
import { Space_Grotesk, Playfair_Display } from 'next/font/google';
import AnnouncementBar from '@/components/layout/AnnouncementBar';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import CartDrawer from '@/components/cart/CartDrawer';
import CollectionFab from '@/components/cart/CollectionFab';
import '@/styles/globals.css';
import '@/styles/animations.css';

const spaceGrotesk = Space_Grotesk({
  variable: '--font-space-grotesk',
  subsets: ['latin'],
  display: 'swap',
  weight: ['400', '500', '600', '700'],
});

const playfairDisplay = Playfair_Display({
  variable: '--font-playfair-display',
  subsets: ['latin'],
  display: 'swap',
  weight: ['400', '500', '600', '700'],
  style: ['normal', 'italic'],
});

export const metadata: Metadata = {
  title: {
    default: 'SILVERTAPE — Curated Art. Every Wall.',
    template: '%s | SILVERTAPE',
  },
  description: '아트 스튜디오 중계 플랫폼. 다양한 스튜디오의 작품을 만나고, 포스터와 프린트로 소장하세요.',
  keywords: ['art poster', 'AI art', 'art platform', 'poster shop', '포스터', '아트 포스터', 'SILVERTAPE', '아트 플랫폼'],
  openGraph: {
    type: 'website',
    locale: 'ko_KR',
    siteName: 'SILVERTAPE',
    title: 'SILVERTAPE — Curated Art. Every Wall.',
    description: '아트 스튜디오 중계 플랫폼. 모든 벽에 예술을.',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <head>
        <link
          rel="stylesheet"
          as="style"
          crossOrigin="anonymous"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css"
        />
      </head>
      <body className={`${spaceGrotesk.variable} ${playfairDisplay.variable}`}>
        <AnnouncementBar />
        <Header />
        {children}
        <Footer />
        <CartDrawer />
        <CollectionFab />
      </body>
    </html>
  );
}
