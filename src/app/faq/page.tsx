import type { Metadata } from 'next';
import Breadcrumb from '@/components/ui/Breadcrumb';
import FaqClient from './FaqClient';
import styles from '../info.module.css';

export const metadata: Metadata = {
  title: '자주 묻는 질문 (FAQ)',
  description: 'SILVERTAPE 주문, 배송, 교환/반품, 제품 정보에 대한 자주 묻는 질문과 답변.',
  alternates: { canonical: 'https://silvertape.art/faq' },
};

const FAQ_DATA = [
  {
    title: '주문 & 결제',
    items: [
      { q: '어떤 결제 수단을 사용할 수 있나요?', a: '신용카드, 체크카드, 카카오페이, 네이버페이, 토스페이 등 다양한 결제 수단을 지원합니다. 모든 결제는 토스페이먼츠를 통해 안전하게 처리됩니다.' },
      { q: '주문 후 취소가 가능한가요?', a: '주문 확인 후 제작에 들어가기 전까지 취소가 가능합니다. 제작이 시작된 이후에는 취소가 어렵습니다. 취소를 원하시면 가능한 빨리 hello@silvertape.art로 연락 주세요.' },
      { q: '한정판이 품절되면 재입고되나요?', a: '아니요. SILVERTAPE의 모든 작품은 한정판으로 제작되며, 에디션이 소진되면 재판하지 않습니다. 마음에 드는 작품은 빠르게 구매하시는 것을 권장합니다.' },
    ],
  },
  {
    title: '배송',
    items: [
      { q: '배송은 얼마나 걸리나요?', a: '주문 후 제작에 영업일 기준 2~4일이 소요되며, 제작 완료 후 1~2일 내에 발송됩니다. 총 영업일 기준 3~6일 정도 예상해 주세요.' },
      { q: '배송비는 얼마인가요?', a: '5만원 이상 주문 시 무료배송입니다. 5만원 미만 주문 시 배송비 3,500원이 부과됩니다. 도서산간 지역은 추가 배송비가 발생할 수 있습니다.' },
      { q: '해외 배송도 가능한가요?', a: '현재는 국내 배송만 지원하고 있습니다. 해외 배송은 추후 서비스 예정입니다.' },
      { q: '배송 중 파손이 걱정됩니다.', a: '프린트 단품은 하드 튜브에, 프레임 포함 제품은 에어캡과 전용 박스로 포장하여 발송합니다. 만약 배송 중 파손이 발생하면 무료로 재발송해 드립니다.' },
    ],
  },
  {
    title: '교환 & 반품',
    items: [
      { q: '교환/반품이 가능한가요?', a: '수령 후 7일 이내에 교환 및 환불이 가능합니다. 단순 변심에 의한 반품도 가능하며, 이 경우 반품 배송비는 고객 부담입니다.' },
      { q: '제품에 하자가 있으면 어떻게 하나요?', a: '인쇄 불량, 프레임 파손 등 제품 하자가 있을 경우 무료로 교환해 드립니다. 수령 후 사진과 함께 hello@silvertape.art로 연락 주세요.' },
      { q: '환불은 언제 처리되나요?', a: '반품 상품 확인 후 영업일 기준 2~3일 내에 결제 취소 처리됩니다. 카드사에 따라 실제 환불까지 추가로 3~5일이 소요될 수 있습니다.' },
    ],
  },
  {
    title: '제품 정보',
    items: [
      { q: '작품은 어떻게 제작되나요?', a: 'SILVERTAPE의 작품들은 각 스튜디오의 고유한 제작 방식을 통해 만들어지고, 전문 보정을 거칩니다. 수천 장의 결과물 중 엄격한 큐레이션을 통과한 작품만 선보입니다.' },
      { q: '프린트 사이즈는 어떻게 되나요?', a: '각 작품마다 여러 사이즈 옵션을 제공합니다. 상세 페이지에서 사이즈별 치수와 가격을 확인하실 수 있습니다.' },
      { q: '프레임 없이 프린트만 구매할 수 있나요?', a: '네, 모든 작품은 프린트 단품으로도 구매 가능합니다. 프레임은 선택 옵션입니다.' },
      { q: '실제 색감과 화면에서 보는 색감이 다를 수 있나요?', a: '모니터 설정에 따라 약간의 색상 차이가 있을 수 있습니다. 다만 12색 지클레 프린트는 높은 색재현성을 제공하므로 화면과 매우 유사한 결과물을 얻을 수 있습니다.' },
    ],
  },
];

export default function FaqPage() {
  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQ_DATA.flatMap(section =>
      section.items.map(item => ({
        '@type': 'Question',
        name: item.q,
        acceptedAnswer: { '@type': 'Answer', text: item.a },
      }))
    ),
  };

  return (
    <main className={styles.page}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <Breadcrumb items={[{ label: '홈', href: '/' }, { label: '자주 묻는 질문' }]} />
      <div className={styles.tag}>FAQ</div>
      <h1 className={styles.title}>자주 묻는 질문</h1>
      <p className={styles.subtitle}>궁금한 점을 확인해 보세요.</p>
      <FaqClient data={FAQ_DATA} />
    </main>
  );
}
