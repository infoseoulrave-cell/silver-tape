import type { Metadata } from 'next';
import Link from 'next/link';
import Breadcrumb from '@/components/ui/Breadcrumb';
import styles from '../info.module.css';

export const metadata: Metadata = {
  title: 'SILVERTAPE 소개 — Curated Art. Every Wall.',
  description: 'SILVERTAPE는 독립 아트 스튜디오 중계 플랫폼입니다. 큐레이팅된 디지털 아트를 프리미엄 프린트로 만나보세요.',
  alternates: { canonical: '/about' },
};

export default function AboutPage() {
  return (
    <main className={styles.page}>
      <Breadcrumb items={[{ label: '홈', href: '/' }, { label: '플랫폼 소개' }]} />

      <div className={styles.tag}>ABOUT</div>
      <h1 className={styles.title}>SILVERTAPE</h1>
      <p className={styles.subtitle}>Tape Art to Your Wall.</p>

      <div className={styles.body}>
        <p>
          2019년, 마우리치오 카텔란은 바나나 한 개를 실버 덕테이프로 벽에 붙였습니다.
          그것만으로 세상은 뒤집어졌습니다.
        </p>
        <p>
          <strong>SILVERTAPE</strong>는 그 질문에서 시작된 아트 스튜디오 플랫폼입니다.
          각기 다른 시선을 가진 스튜디오들이 큐레이팅한 감각, 프리미엄 프린트의 물성 &mdash;
          이 두 레이어가 하나의 실버 테이프로 당신의 벽 위에 고정됩니다.
        </p>

        <h2>우리가 하는 일</h2>
        <p>
          SILVERTAPE는 독립 아트 스튜디오들의 작품을 큐레이팅하고,
          고품질 프린트와 프레임으로 제작하여 전달하는 플랫폼입니다.
          각 스튜디오는 고유한 미학과 세계관을 가지고 있으며,
          우리는 그 작품들이 당신의 공간에 완벽하게 안착하도록 돕습니다.
        </p>

        <div className={styles.features}>
          <div className={styles.feature}>
            <div className={styles.featureIcon}>&#9670;</div>
            <div className={styles.featureTitle}>CURATED</div>
            <div className={styles.featureDesc}>
              엄격한 큐레이션을 거친 작품만을 제공합니다. 수천 장 중 선별된 작품들.
            </div>
          </div>
          <div className={styles.feature}>
            <div className={styles.featureIcon}>&#9671;</div>
            <div className={styles.featureTitle}>PREMIUM PRINT</div>
            <div className={styles.featureDesc}>
              220gsm 프리미엄 아트지, 12색 지클레 프린트, 100년+ 아카이벌 등급 잉크를 사용합니다.
            </div>
          </div>
          <div className={styles.feature}>
            <div className={styles.featureIcon}>&#9674;</div>
            <div className={styles.featureTitle}>LIMITED EDITION</div>
            <div className={styles.featureDesc}>
              모든 작품은 한정판으로 제작됩니다. 품절 후 재판하지 않습니다.
            </div>
          </div>
        </div>

        <h2>입점 스튜디오</h2>
        <p>
          현재 SILVERTAPE에는 네 개의 스튜디오가 입점해 있습니다.
        </p>
        <ul>
          <li>
            <Link href="/studio/hangover"><strong>HANGOVER</strong></Link> &mdash;
            감각을 자극하는 그래픽 아트 포스터. 예술에 취하다.
          </li>
          <li>
            <Link href="/studio/void"><strong>MONORO.</strong></Link> &mdash;
            관조적 미니멀리즘. 본질만 남긴 디지털 아트.
          </li>
          <li>
            <Link href="/studio/sensibility"><strong>SENSIBILITY STAIR</strong></Link> &mdash;
            감각을 깨우는 시각적 충돌. 대비와 물성의 스터디.
          </li>
          <li>
            <Link href="/studio/phantom-reel"><strong>ONE WAY TICKET</strong></Link> &mdash;
            어디에도 없는 곳에서 수신된 필름. 초현실 컨셉츄얼 포토그래피.
          </li>
        </ul>

        <h2>프린트 품질</h2>
        <ul>
          <li><strong>용지:</strong> 프리미엄 아트지 220gsm, 매트 피니시</li>
          <li><strong>인쇄:</strong> 12색 지클레 프린트, 아카이벌 잉크</li>
          <li><strong>내구성:</strong> 100년 이상 색상 보존 (아카이벌 등급)</li>
          <li><strong>해상도:</strong> 300 DPI 이상</li>
          <li><strong>프레임:</strong> 알루미늄/천연 원목, UV 차단 아크릴 글레이징</li>
        </ul>

        <div className={styles.contactBox}>
          <p>입점 문의, 협업 제안, 기타 궁금한 점이 있으시면</p>
          <p><a href="mailto:hello@silvertape.art">hello@silvertape.art</a></p>
        </div>
      </div>
    </main>
  );
}
