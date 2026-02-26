import type { Metadata } from 'next';
import { Space_Grotesk, Playfair_Display } from 'next/font/google';
import AnnouncementBar from '@/components/layout/AnnouncementBar';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import CartDrawer from '@/components/cart/CartDrawer';
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
    default: 'HANGOVER — Get Wasted on Art',
    template: '%s | HANGOVER',
  },
  description: 'AI가 만든 프리미엄 그래픽 아트 포스터. 크롬, 모뉴먼트, 텍스처, 시네마, 미스 — 벽 위의 숙취.',
  keywords: ['art poster', 'AI art', 'graphic art', 'poster shop', '포스터', '아트 포스터', 'HANGOVER'],
  openGraph: {
    type: 'website',
    locale: 'ko_KR',
    siteName: 'HANGOVER',
    title: 'HANGOVER — Get Wasted on Art',
    description: 'AI가 만든 프리미엄 그래픽 아트 포스터 스토어',
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
      </body>
    </html>
  );
}
