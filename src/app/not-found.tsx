import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: '404 - Page Not Found',
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return (
    <main style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '60vh',
      padding: '40px 20px',
      textAlign: 'center',
    }}>
      <p style={{
        fontFamily: 'var(--ho-font-heading)',
        fontSize: '0.7rem',
        fontWeight: 700,
        letterSpacing: '0.2em',
        textTransform: 'uppercase' as const,
        color: 'var(--ho-text-muted)',
        marginBottom: '16px',
      }}>
        404
      </p>
      <h1 style={{
        fontFamily: 'var(--ho-font-heading)',
        fontSize: 'clamp(2rem, 5vw, 3.5rem)',
        fontWeight: 700,
        letterSpacing: '-0.02em',
        color: 'var(--ho-text)',
        marginBottom: '16px',
      }}>
        페이지를 찾을 수 없습니다
      </h1>
      <p style={{
        fontSize: '1rem',
        color: 'var(--ho-text-secondary)',
        marginBottom: '40px',
        maxWidth: '480px',
      }}>
        요청하신 페이지가 존재하지 않거나 이동되었을 수 있습니다.
      </p>
      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' as const, justifyContent: 'center' }}>
        <Link
          href="/"
          style={{
            padding: '14px 32px',
            background: 'var(--ho-accent)',
            color: 'var(--ho-bg)',
            fontFamily: 'var(--ho-font-heading)',
            fontSize: '12px',
            fontWeight: 700,
            letterSpacing: '0.1em',
            textTransform: 'uppercase' as const,
          }}
        >
          Home
        </Link>
        <Link
          href="/shop"
          style={{
            padding: '14px 32px',
            border: '1px solid rgba(0,0,0,0.15)',
            fontFamily: 'var(--ho-font-heading)',
            fontSize: '12px',
            fontWeight: 700,
            letterSpacing: '0.1em',
            textTransform: 'uppercase' as const,
            color: 'var(--ho-text)',
          }}
        >
          Shop
        </Link>
        <Link
          href="/studios"
          style={{
            padding: '14px 32px',
            border: '1px solid rgba(0,0,0,0.15)',
            fontFamily: 'var(--ho-font-heading)',
            fontSize: '12px',
            fontWeight: 700,
            letterSpacing: '0.1em',
            textTransform: 'uppercase' as const,
            color: 'var(--ho-text)',
          }}
        >
          Studios
        </Link>
      </div>
    </main>
  );
}
