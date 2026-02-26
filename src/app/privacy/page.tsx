import type { Metadata } from 'next';
import Breadcrumb from '@/components/ui/Breadcrumb';
import styles from '../info.module.css';

export const metadata: Metadata = {
  title: '개인정보처리방침 — SILVERTAPE',
  description: 'SILVERTAPE 개인정보처리방침',
};

export default function PrivacyPage() {
  return (
    <main className={styles.page}>
      <Breadcrumb items={[{ label: '홈', href: '/' }, { label: '개인정보처리방침' }]} />

      <div className={styles.tag}>PRIVACY POLICY</div>
      <h1 className={styles.title}>개인정보처리방침</h1>
      <p className={styles.lastUpdated}>최종 수정일: 2026년 2월 26일</p>

      <div className={`${styles.body} ${styles.legal}`}>
        <h2>1. 수집하는 개인정보</h2>
        <p>SILVERTAPE는 서비스 제공을 위해 다음의 개인정보를 수집합니다.</p>

        <h3>주문 시 필수 수집 항목</h3>
        <ul>
          <li>수령인 이름, 연락처, 배송지 주소</li>
          <li>결제 정보 (결제 대행사를 통해 처리, 회사는 카드번호를 직접 저장하지 않음)</li>
          <li>이메일 주소 (주문 확인 및 배송 안내용)</li>
        </ul>

        <h3>자동 수집 항목</h3>
        <ul>
          <li>IP 주소, 브라우저 유형, 접속 시간</li>
          <li>쿠키 및 유사 기술을 통한 서비스 이용 기록</li>
        </ul>

        <h2>2. 개인정보 이용 목적</h2>
        <p>수집된 개인정보는 다음의 목적으로만 이용됩니다.</p>
        <ul>
          <li>주문 처리 및 배송</li>
          <li>결제 및 환불 처리</li>
          <li>고객 문의 응대</li>
          <li>서비스 개선 및 통계 분석 (비식별 처리)</li>
          <li>뉴스레터 발송 (수신 동의한 경우에 한함)</li>
        </ul>

        <h2>3. 개인정보 보유 기간</h2>
        <ul>
          <li><strong>주문 정보:</strong> 전자상거래법에 따라 5년간 보관</li>
          <li><strong>결제 기록:</strong> 전자상거래법에 따라 5년간 보관</li>
          <li><strong>접속 로그:</strong> 통신비밀보호법에 따라 3개월 보관</li>
          <li><strong>뉴스레터 수신 정보:</strong> 수신 철회 시까지</li>
        </ul>
        <p>보유 기간 경과 후에는 지체 없이 파기합니다.</p>

        <h2>4. 개인정보 제3자 제공</h2>
        <p>
          회사는 이용자의 동의 없이 개인정보를 제3자에게 제공하지 않습니다.
          다만 다음의 경우는 예외로 합니다.
        </p>
        <ul>
          <li>배송을 위한 물류업체 (수령인 이름, 연락처, 주소)</li>
          <li>결제 처리를 위한 결제 대행사 (토스페이먼츠)</li>
          <li>법령에 의한 요청이 있는 경우</li>
        </ul>

        <h2>5. 개인정보 처리 위탁</h2>
        <ul>
          <li><strong>결제 처리:</strong> 토스페이먼츠 (결제 대행)</li>
          <li><strong>배송:</strong> 택배사 (상품 배송)</li>
        </ul>

        <h2>6. 이용자의 권리</h2>
        <p>이용자는 언제든지 다음의 권리를 행사할 수 있습니다.</p>
        <ul>
          <li>개인정보 열람 요청</li>
          <li>개인정보 정정 및 삭제 요청</li>
          <li>개인정보 처리 정지 요청</li>
          <li>뉴스레터 수신 철회</li>
        </ul>
        <p>
          위 요청은 <a href="mailto:hello@silvertape.art">hello@silvertape.art</a>로
          연락 주시면 영업일 기준 3일 이내에 처리됩니다.
        </p>

        <h2>7. 쿠키 사용</h2>
        <p>
          SILVERTAPE는 서비스 이용 편의를 위해 쿠키를 사용합니다.
          이용자는 브라우저 설정을 통해 쿠키 저장을 거부할 수 있으나,
          이 경우 일부 서비스 이용에 제한이 있을 수 있습니다.
        </p>

        <h2>8. 개인정보 보호책임자</h2>
        <ul>
          <li><strong>이메일:</strong> <a href="mailto:hello@silvertape.art">hello@silvertape.art</a></li>
        </ul>
        <p>
          개인정보 침해에 대한 신고나 상담이 필요한 경우
          개인정보침해신고센터(privacy.kisa.or.kr, 118)로 문의하실 수 있습니다.
        </p>
      </div>
    </main>
  );
}
