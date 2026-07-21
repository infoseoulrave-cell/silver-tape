'use client';

import { useState, useEffect } from 'react';

const NAVER_STORE_URL = 'https://smartstore.naver.com/1of23';

export default function NoticePopup() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // 오늘 하루 안 보기 체크
    const dismissed = localStorage.getItem('notice-popup-dismissed');
    if (dismissed) {
      const dismissedDate = new Date(dismissed).toDateString();
      const today = new Date().toDateString();
      if (dismissedDate === today) return;
    }
    // 약간의 딜레이 후 표시
    const timer = setTimeout(() => setIsOpen(true), 800);
    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => setIsOpen(false);

  const handleDismissToday = () => {
    localStorage.setItem('notice-popup-dismissed', new Date().toISOString());
    setIsOpen(false);
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
    >
      {/* 백드롭 */}
      <div
        onClick={handleClose}
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(0,0,0,0.55)',
          backdropFilter: 'blur(4px)',
          animation: 'fadeIn 0.3s ease',
        }}
      />

      {/* 팝업 카드 */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: '420px',
          background: '#fff',
          borderRadius: '16px',
          overflow: 'hidden',
          boxShadow: '0 25px 60px rgba(0,0,0,0.3)',
          animation: 'popIn 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)',
        }}
      >
        {/* 상단 바 */}
        <div style={{ background: '#111', padding: '24px 24px 20px', textAlign: 'center' }}>
          <p style={{
            color: '#888',
            fontSize: '11px',
            letterSpacing: '3px',
            margin: '0 0 8px',
            fontFamily: 'var(--font-space-grotesk), sans-serif',
            textTransform: 'uppercase' as const,
          }}>
            SILVERTAPE NOTICE
          </p>
          <h2 style={{
            color: '#fff',
            fontSize: '18px',
            fontWeight: 700,
            margin: 0,
            fontFamily: 'var(--font-space-grotesk), Pretendard, sans-serif',
          }}>
            잠시 쉬어가는 중이에요
          </h2>
        </div>

        {/* 본문 */}
        <div style={{ padding: '28px 24px 20px' }}>
          <p style={{
            fontSize: '15px',
            lineHeight: 1.85,
            color: '#333',
            margin: '0 0 6px',
            wordBreak: 'keep-all',
            fontFamily: 'Pretendard, "Noto Sans KR", sans-serif',
          }}>
            오픈 초기, 예상보다 훨씬 많은 분들이 SILVERTAPE를 찾아주셨습니다.
          </p>
          <p style={{
            fontSize: '15px',
            lineHeight: 1.85,
            color: '#333',
            margin: '0 0 6px',
            wordBreak: 'keep-all',
            fontFamily: 'Pretendard, "Noto Sans KR", sans-serif',
          }}>
            여러분의 관심이 저희의 준비보다 앞서간 탓에,
            홈페이지에 <strong>일시적인 오류</strong>가 발생했어요.
          </p>
          <p style={{
            fontSize: '15px',
            lineHeight: 1.85,
            color: '#333',
            margin: '0 0 22px',
            wordBreak: 'keep-all',
            fontFamily: 'Pretendard, "Noto Sans KR", sans-serif',
          }}>
            지금 빠르게 수정하고 있으며,
            곧 더 안정적인 모습으로 돌아오겠습니다.
          </p>

          {/* 구분선 */}
          <div style={{
            height: '1px',
            background: 'linear-gradient(to right, transparent, #ddd, transparent)',
            margin: '0 0 20px',
          }} />

          <p style={{
            fontSize: '13.5px',
            lineHeight: 1.7,
            color: '#666',
            margin: '0 0 16px',
            wordBreak: 'keep-all',
            fontFamily: 'Pretendard, "Noto Sans KR", sans-serif',
          }}>
            지금 바로 구매를 원하시는 분은
            네이버 스마트스토어를 이용해 주세요.
          </p>

          {/* 네이버 스토어 버튼 */}
          <a
            href={NAVER_STORE_URL}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              width: '100%',
              padding: '14px 0',
              background: '#03C75A',
              color: '#fff',
              fontSize: '15px',
              fontWeight: 700,
              borderRadius: '10px',
              textDecoration: 'none',
              border: 'none',
              cursor: 'pointer',
              fontFamily: 'Pretendard, "Noto Sans KR", sans-serif',
              transition: 'transform 0.15s, box-shadow 0.15s',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)';
              (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 12px rgba(3,199,90,0.35)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
              (e.currentTarget as HTMLElement).style.boxShadow = 'none';
            }}
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M11.34 9.58L6.26 2.7H2.7v12.6h4.36V8.42l5.08 6.88h3.56V2.7h-4.36v6.88z" fill="white"/>
            </svg>
            네이버 스토어에서 구매하기
          </a>

          <p style={{
            fontSize: '12px',
            color: '#aaa',
            textAlign: 'center',
            margin: '14px 0 0',
            fontFamily: 'Pretendard, "Noto Sans KR", sans-serif',
          }}>
            불편을 드려 죄송합니다. 찾아주셔서 감사해요.
          </p>
        </div>

        {/* 하단 버튼 */}
        <div style={{
          display: 'flex',
          borderTop: '1px solid #f0f0f0',
        }}>
          <button
            onClick={handleDismissToday}
            style={{
              flex: 1,
              padding: '14px',
              background: 'none',
              border: 'none',
              fontSize: '13px',
              color: '#999',
              cursor: 'pointer',
              fontFamily: 'Pretendard, "Noto Sans KR", sans-serif',
            }}
          >
            오늘 하루 안 보기
          </button>
          <div style={{ width: '1px', background: '#f0f0f0' }} />
          <button
            onClick={handleClose}
            style={{
              flex: 1,
              padding: '14px',
              background: 'none',
              border: 'none',
              fontSize: '13px',
              color: '#333',
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: 'Pretendard, "Noto Sans KR", sans-serif',
            }}
          >
            닫기
          </button>
        </div>
      </div>

      {/* 애니메이션 */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes popIn {
          from { opacity: 0; transform: scale(0.9) translateY(20px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>
  );
}
