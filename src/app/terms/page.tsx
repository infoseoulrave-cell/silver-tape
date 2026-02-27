import type { Metadata } from 'next';
import Breadcrumb from '@/components/ui/Breadcrumb';
import styles from '../info.module.css';

export const metadata: Metadata = {
  title: '이용약관 — SILVERTAPE',
  description: 'SILVERTAPE 서비스 이용약관',
};

export default function TermsPage() {
  return (
    <main className={styles.page}>
      <Breadcrumb items={[{ label: '홈', href: '/' }, { label: '이용약관' }]} />

      <div className={styles.tag}>TERMS OF SERVICE</div>
      <h1 className={styles.title}>이용약관</h1>
      <p className={styles.lastUpdated}>최종 수정일: 2026년 2월 26일</p>

      <div className={`${styles.body} ${styles.legal}`}>
        <h2>제1조 (목적)</h2>
        <p>
          본 약관은 SILVERTAPE(이하 &ldquo;회사&rdquo;)가 제공하는 온라인 아트 프린트 판매 서비스(이하 &ldquo;서비스&rdquo;)의
          이용과 관련하여 회사와 이용자 간의 권리, 의무 및 책임사항을 규정함을 목적으로 합니다.
        </p>

        <h2>제2조 (정의)</h2>
        <ol>
          <li><strong>&ldquo;서비스&rdquo;</strong>란 회사가 silvertape.art 웹사이트를 통해 제공하는 아트 프린트 판매 및 관련 서비스를 말합니다.</li>
          <li><strong>&ldquo;이용자&rdquo;</strong>란 본 약관에 따라 회사가 제공하는 서비스를 이용하는 자를 말합니다.</li>
          <li><strong>&ldquo;스튜디오&rdquo;</strong>란 회사 플랫폼에 입점하여 작품을 판매하는 아트 스튜디오를 말합니다.</li>
        </ol>

        <h2>제3조 (약관의 효력)</h2>
        <p>
          본 약관은 서비스 화면에 게시하거나 기타의 방법으로 이용자에게 공지함으로써 효력이 발생합니다.
          회사는 관련 법령에 위배되지 않는 범위에서 본 약관을 변경할 수 있으며,
          변경된 약관은 공지 후 7일이 경과한 날로부터 효력이 발생합니다.
        </p>

        <h2>제4조 (서비스 내용)</h2>
        <p>회사가 제공하는 서비스는 다음과 같습니다.</p>
        <ol>
          <li>디지털 아트 작품의 큐레이션 및 판매</li>
          <li>프리미엄 프린트 및 프레임 제작 서비스</li>
          <li>입점 스튜디오 작품 중계</li>
          <li>기타 회사가 정하는 서비스</li>
        </ol>

        <h2>제5조 (주문 및 결제)</h2>
        <ol>
          <li>이용자는 서비스 내에서 제공되는 방법에 따라 상품을 주문합니다.</li>
          <li>결제는 신용카드, 간편결제(카카오페이, 네이버페이, 토스페이 등) 등 회사가 제공하는 방법으로 이루어집니다.</li>
          <li>주문 완료 후 제작에 착수하며, 제작 시작 이후에는 주문 취소가 제한될 수 있습니다.</li>
        </ol>

        <h2>제6조 (배송)</h2>
        <ol>
          <li>상품은 주문 후 영업일 기준 2~4일 내에 제작되며, 제작 완료 후 1~2일 내에 발송됩니다.</li>
          <li>5만원 이상 주문 시 무료배송이며, 미만 시 배송비 3,500원이 부과됩니다.</li>
          <li>도서산간 지역은 추가 배송비가 발생할 수 있습니다.</li>
          <li>배송 중 발생한 파손에 대해서는 회사가 무료 재발송 책임을 집니다.</li>
        </ol>

        <h2>제7조 (교환 및 환불)</h2>
        <ol>
          <li>상품 수령 후 7일 이내에 교환 및 환불을 요청할 수 있습니다.</li>
          <li>단순 변심에 의한 반품의 경우 반품 배송비는 이용자 부담입니다.</li>
          <li>제품 하자(인쇄 불량, 프레임 파손 등)의 경우 무료로 교환해 드립니다.</li>
          <li>환불은 반품 상품 확인 후 영업일 기준 2~3일 내에 처리됩니다.</li>
        </ol>

        <h2>제8조 (저작권)</h2>
        <ol>
          <li>서비스에 게시된 모든 작품의 저작권은 해당 스튜디오 또는 회사에 있습니다.</li>
          <li>이용자는 구매한 프린트를 개인적 용도로 전시할 수 있으나, 복제, 배포, 상업적 이용은 금지됩니다.</li>
          <li>서비스 내 이미지의 무단 다운로드, 캡처, 복제는 저작권법에 의해 보호됩니다.</li>
        </ol>

        <h2>제9조 (면책)</h2>
        <ol>
          <li>회사는 천재지변, 시스템 장애 등 불가항력에 의한 서비스 중단에 대해 책임을 지지 않습니다.</li>
          <li>모니터 설정에 따른 색상 차이에 대해서는 교환/환불 사유에 해당하지 않을 수 있습니다.</li>
        </ol>

        <h2>제10조 (분쟁 해결)</h2>
        <p>
          본 약관과 관련한 분쟁은 대한민국 법령에 따르며,
          분쟁 발생 시 서울중앙지방법원을 제1심 관할법원으로 합니다.
        </p>
      </div>
    </main>
  );
}
