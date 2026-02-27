import type { Metadata } from 'next';
import { Space_Grotesk, Playfair_Display } from 'next/font/google';
import AnnouncementBar from '@/components/layout/AnnouncementBar';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import CartDrawer from '@/components/cart/CartDrawer';
import CollectionFab from '@/components/cart/CollectionFab';
import MetaPixel from '@/components/analytics/MetaPixel';
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

const SITE_URL = 'https://silvertape.art';
const ALT_URL = 'https://silver-tape.com';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'SILVERTAPE — Curated Art. Every Wall.',
    template: '%s | SILVERTAPE',
  },
  description: '아트 스튜디오 중계 플랫폼. 다양한 스튜디오의 작품을 만나고, 포스터와 프린트로 소장하세요.',
  keywords: [
    '아트 포스터', '아트 프린트', '인테리어 포스터', '인테리어 그림',
    '벽 장식', '거실 그림', '프리미엄 포스터', '한정판 아트',
    '감성 포스터', '그래픽 아트', '디지털 아트 프린트', '큐레이션 아트',
    '포스터 액자', '아트 액자', 'SILVERTAPE', '실버테이프',
    '그림 액자 추천', '인테리어 소품', '집들이 선물',
    'art poster', 'curated art', 'art platform', 'poster shop',
  ],
  alternates: {
    canonical: SITE_URL,
  },
  openGraph: {
    type: 'website',
    locale: 'ko_KR',
    siteName: 'SILVERTAPE',
    title: 'SILVERTAPE — Curated Art. Every Wall.',
    description: '큐레이션 스튜디오가 엄선한 프리미엄 아트 프린트. 당신의 공간을 갤러리로 만들어 드립니다.',
    images: [
      {
        url: `${SITE_URL}/og-image.png`,
        width: 1200,
        height: 630,
        alt: 'SILVERTAPE — 모든 벽에 예술을',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SILVERTAPE — Curated Art. Every Wall.',
    description: '큐레이션 스튜디오가 엄선한 프리미엄 아트 프린트. 당신의 공간을 갤러리로 만들어 드립니다.',
    images: [`${SITE_URL}/og-image.png`],
  },
  other: {
    'og:url': SITE_URL,
    'al:web:url': ALT_URL,
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
        <meta name="naver-site-verification" content="b315dfbb8bea426160b8e2c02fb3a483cf53e65c" />
        <link
          rel="stylesheet"
          as="style"
          crossOrigin="anonymous"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css"
        />
      </head>
      <body className={`${spaceGrotesk.variable} ${playfairDisplay.variable}`}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Organization',
              name: 'SILVERTAPE',
              alternateName: '실버테이프',
              url: SITE_URL,
              logo: `${SITE_URL}/logo-header.webp`,
              contactPoint: { '@type': 'ContactPoint', email: 'hello@silvertape.art', contactType: 'customer service' },
              description: '큐레이션 아트 프린트 플랫폼. 모든 벽에 예술을.',
            }),
          }}
        />
        <AnnouncementBar />
        <Header />
        {children}
        <Footer />
        <CartDrawer />
        <CollectionFab />
        <MetaPixel />
      </body>
    </html>
  );
}
