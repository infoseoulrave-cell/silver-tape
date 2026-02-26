'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import styles from './fail.module.css';

const ERROR_MESSAGES: Record<string, string> = {
  PAY_PROCESS_CANCELED: '결제를 취소했습니다.',
  USER_CANCEL: '결제를 취소했습니다.',
  PAY_PROCESS_ABORTED: '결제 진행 중 문제가 발생했습니다.',
  REJECT_CARD_COMPANY: '카드사에서 결제를 거절했습니다. 다른 카드를 사용해주세요.',
  INVALID_CARD_COMPANY: '유효하지 않은 카드입니다.',
  EXCEED_MAX_DAILY_PAYMENT_COUNT: '일일 결제 한도를 초과했습니다.',
  NOT_AVAILABLE_PAYMENT: '현재 사용할 수 없는 결제 수단입니다.',
  INVALID_REJECT_CARD: '카드 정보를 다시 확인해주세요.',
  BELOW_MINIMUM_AMOUNT: '최소 결제 금액 이하입니다.',
  INVALID_REQUEST: '잘못된 요청입니다.',
  NOT_FOUND_PAYMENT_SESSION: '결제 세션이 만료되었습니다. 다시 시도해주세요.',
  PROVIDER_ERROR: '결제 서비스에 일시적인 문제가 있습니다.',
  UNKNOWN: '결제 처리 중 오류가 발생했습니다.',
};

function FailContent() {
  const searchParams = useSearchParams();
  const errorCode = searchParams.get('code') ?? 'UNKNOWN';
  const rawMessage = searchParams.get('message');
  const errorMessage = rawMessage ?? ERROR_MESSAGES[errorCode] ?? ERROR_MESSAGES.UNKNOWN;

  const isCancel = errorCode === 'PAY_PROCESS_CANCELED' || errorCode === 'USER_CANCEL';

  return (
    <div className={styles.card}>
      <div className={styles.icon}>{isCancel ? '\u2190' : '\u00D7'}</div>
      <h1 className={styles.title}>{isCancel ? '결제 취소' : '결제 실패'}</h1>
      <p className={styles.subtitle}>{errorMessage}</p>

      {!isCancel && (
        <div className={styles.errorBox}>
          <span className={styles.errorLabel}>에러 코드</span>
          <span className={styles.errorCode}>{errorCode}</span>
        </div>
      )}

      <div className={styles.actions}>
        <Link href="/checkout" className={styles.primaryBtn}>
          {isCancel ? '결제로 돌아가기' : '다시 시도'}
        </Link>
        <Link href="/cart" className={styles.secondaryBtn}>
          장바구니로
        </Link>
      </div>
    </div>
  );
}

export default function CheckoutFailPage() {
  return (
    <main className={styles.container}>
      <Suspense fallback={<div className={styles.card}>로딩 중...</div>}>
        <FailContent />
      </Suspense>
    </main>
  );
}
