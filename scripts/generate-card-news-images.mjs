#!/usr/bin/env node
/**
 * 인스타그램 카드뉴스 30장을 PNG로 생성 (독립형 — 서버 불필요)
 * 사진 배경 + 다크 오버레이 + 볼드 흰색 텍스트
 *
 * 사용: node scripts/generate-card-news-images.mjs
 * 필요: puppeteer
 */

import { mkdir } from 'fs/promises';
import { join } from 'path';

const OUT_DIR = join(process.cwd(), 'public', 'instagram', 'card-news');
const WIDTH = 1080;
const HEIGHT = 1350;

const CARDS = [
  {
    id: 1, themeLabel: '과거의 물감',
    title: '1만 9천 년 전,\n동굴 벽화의 색은?',
    lines: ['라스코 동굴 벽화는 천연광물 안료만 사용했다.', '빻은 광물로 만든 빨강·노랑·검정·흰색.', '유기물을 쓰지 않아 탄소연대측정이 불가능했고,', '동굴에서 발견된 뼈로 약 1만 9천 년 전으로 추정된다.'],
    accent: '#8B4513',
    photoSeed: 'cave-painting-ancient-wall',
  },
  {
    id: 2, themeLabel: '과거의 물감',
    title: '보라색이\n금만큼 비쌌던 시대',
    lines: ['티리언 퍼플은 뿔고둥 점액으로 만든 염료.', '옷 한 벌 염색에 25만 마리 바다달팽이가 필요했다.', '4세기 이후 로마에서는 황제만 이 색을 입을 수 있었고,', '"로얄 퍼플"이라는 이름이 여기서 유래했다.'],
    accent: '#6C3483',
    photoSeed: 'purple-silk-royal-fabric',
  },
  {
    id: 3, themeLabel: '과거의 물감',
    title: '유화가\n르네상스를 바꿨다',
    lines: ['15세기 초 얀 판 에이크가 유화를 보편화했다.', '템페라(계란 노른자+안료)는 빨리 마르고 수정이 어려웠지만,', '유화는 세밀한 명암·색채 표현을 가능하게 했다.', "'아르놀피니의 결혼식'이 유화 혁명의 상징이 됐다."],
    accent: '#C0392B',
    photoSeed: 'oil-painting-canvas-renaissance',
  },
  {
    id: 4, themeLabel: '과거의 물감',
    title: '물감이 튜브에\n담기기까지',
    lines: ['1824년 영국에서 금속 튜브가 발명되기 전까지,', '화가들은 돼지 방광에 물감을 보관했다.', '르누아르는 이렇게 말했다:', '"튜브가 없었다면 인상파도 없었을 것이다."'],
    accent: '#7D6608',
    photoSeed: 'paint-tubes-art-supplies-colorful',
  },
  {
    id: 5, themeLabel: '색의 심리학',
    title: '빨강이\n심박수를 올린다',
    lines: ['빨간색은 교감신경을 자극해 심박수와 혈압을 높인다.', '주의력을 집중시키고 각성 수준을 올리는 효과.', '열정과 에너지, 동시에 분노와 위험의 감정도 유발.', '식당이 빨간 인테리어를 쓰는 이유가 여기 있다.'],
    accent: '#C0392B',
    photoSeed: 'red-abstract-passion-heart',
  },
  {
    id: 6, themeLabel: '색의 심리학',
    title: '파랑은 왜\n신뢰의 색일까?',
    lines: ['파란색은 부교감신경을 촉진해 마음을 안정시킨다.', '집중력을 높이고 스트레스를 줄이는 효과가 연구로 확인됐다.', '페이스북, 삼성, IBM 모두 파란색 로고를 쓴다.', '전 세계에서 가장 선호되는 색 1위 — 파랑.'],
    accent: '#1A5276',
    photoSeed: 'blue-ocean-calm-trust',
  },
  {
    id: 7, themeLabel: '색의 심리학',
    title: '초록이 눈을\n편하게 하는 이유',
    lines: ['초록색은 가시광선 중앙(520nm)에 위치해', '눈의 수정체가 가장 편하게 초점을 맞출 수 있다.', '자연을 연상시켜 심리적 안정감과 치유 효과를 준다.', '수술실 가운이 초록색인 이유이기도 하다.'],
    accent: '#145A32',
    photoSeed: 'green-forest-nature-leaves',
  },
  {
    id: 8, themeLabel: '미술사 미스터리',
    title: '모나리자 도난:\n루브르가 빈 벽을\n전시한 날',
    lines: ['1911년 루브르 직원 빈센초 페루자가 모나리자를 훔쳤다.', '2년간 자기 아파트 트렁크에 숨겼고,', '이탈리아 화상에게 팔려다 잡혔다.', '도난 후 루브르 방문객이 2배로 늘었다 — 빈 벽을 보러.'],
    accent: '#4A235A',
    photoSeed: 'louvre-museum-paris-gallery',
  },
  {
    id: 9, themeLabel: '미술사 미스터리',
    title: '5억 달러의 미술품이\n아직도 사라진 채',
    lines: ['1990년 보스턴 가드너 박물관에서 경찰 복장의 도둑 2명이', '렘브란트, 베르메르 등 13점을 훔쳤다.', '총 5억 달러 — 역사상 최대 규모의 미술품 절도.', '35년이 지난 지금도 빈 액자가 그 자리에 걸려 있다.'],
    accent: '#922B21',
    photoSeed: 'museum-empty-frame-dark',
  },
  {
    id: 10, themeLabel: '미술사 미스터리',
    title: '인상파가 처음\n등장했을 때',
    lines: ['1874년 첫 인상주의 전시회.', "비평가 루이 르루아가 모네의 '인상, 해돋이'를 보고", '"인상주의자"라며 조롱한 것이 이름의 유래.', '살롱에서 거부당한 화가들의 반란이 미술사를 바꿨다.'],
    accent: '#0E6655',
    photoSeed: 'impressionist-garden-flowers-monet',
  },
  {
    id: 11, themeLabel: '화가 이야기',
    title: '고흐, 생전에\n팔린 그림은 단 1점',
    lines: ['빈센트 반 고흐는 생전에 약 900점의 그림을 그렸다.', "팔린 것은 '아를의 붉은 포도밭' 단 1점. 400프랑.", '37세에 세상을 떠났고, 사후 그의 그림은', '수억 달러에 거래된다.'],
    accent: '#7D6608',
    photoSeed: 'starry-night-wheat-field-painting',
  },
  {
    id: 12, themeLabel: '화가 이야기',
    title: '다빈치 vs 미켈란젤로:\n세기의 라이벌',
    lines: ['1504년 피렌체 시청사 벽화를 두 거장이 동시에 작업.', "다빈치 — '앙기아리 전투', 미켈란젤로 — '카시나 전투'.", '둘 다 미완성으로 끝났지만,', '르네상스 미술의 정점을 보여준 경쟁이었다.'],
    accent: '#2C3E50',
    photoSeed: 'florence-renaissance-cathedral-dome',
  },
  {
    id: 13, themeLabel: '화가 이야기',
    title: '프리다 칼로:\n고통이 만든 예술',
    lines: ['18세에 교통사고로 척추·골반이 부러졌다.', '평생 30번 이상의 수술을 받으며 그림을 그렸다.', '143점의 작품 중 55점이 자화상.', '"나는 내가 가장 잘 아는 주제를 그린다 — 나 자신."'],
    accent: '#C0392B',
    photoSeed: 'colorful-flowers-mexican-art',
  },
  {
    id: 14, themeLabel: '화가 이야기',
    title: "뭉크 '절규' 속\n하늘의 비밀",
    lines: ['1883년 인도네시아 크라카타우 화산 폭발.', '분출된 화산재가 전 세계 하늘을 붉게 물들였다.', '뭉크가 본 노르웨이의 핏빛 석양이', "'절규'의 배경이 되었다는 연구가 있다."],
    accent: '#E74C3C',
    photoSeed: 'dramatic-red-sunset-sky-fire',
  },
  {
    id: 15, themeLabel: '디지털 vs 필름',
    title: '필름은 화학,\n디지털은 전기',
    lines: ['필름: 빛이 은염 입자에 화학 반응을 일으켜 기록.', '디지털: 이미지 센서가 빛을 전기 신호로 변환.', '같은 "사진"이지만 완전히 다른 과정.', '필름의 그레인 vs 디지털의 노이즈 — 미학의 차이.'],
    accent: '#1C2833',
    photoSeed: 'film-camera-vintage-analog',
  },
  {
    id: 16, themeLabel: '디지털 vs 필름',
    title: 'MZ세대가\n필름을 다시 찾는 이유',
    lines: ['한국후지필름 일회용 카메라 판매량 전년 대비 200% 증가.', '니콘 헤리티지 라인 10~30대 비중이 40%→61%.', '스마트폰의 과한 보정에 피로를 느끼고,', '"있는 그대로"의 색감과 한 장의 무게를 찾는다.'],
    accent: '#7D3C98',
    photoSeed: 'vintage-film-rolls-darkroom',
  },
  {
    id: 17, themeLabel: '사진 예술',
    title: '흑백사진이\n더 감성적인 이유',
    lines: ['색을 제거하면 빛과 그림자, 형태에 집중하게 된다.', '뇌가 색 정보 처리에 쓰는 에너지가 감정 해석으로 이동.', '앙리 카르티에 브레송, 안셀 아담스 —', '흑백으로 시대를 기록한 거장들.'],
    accent: '#2C3E50',
    photoSeed: 'black-white-photography-portrait',
  },
  {
    id: 18, themeLabel: '사진 예술',
    title: '세계에서 가장 비싼\n사진 작품',
    lines: ["만 레이의 'Le Violon d'Ingres' — 1,240만 달러(2022).", "에드워드 스타이컨의 'The Pond' — 290만 달러.", '신디 셔먼의 자화상 시리즈 — 390만 달러.', '사진도 회화 못지않은 예술적 가치를 인정받는다.'],
    accent: '#4A235A',
    photoSeed: 'art-gallery-exhibition-frames',
  },
  {
    id: 19, themeLabel: '작품이 주는 효과',
    title: '미술치료:\n우울 점수 55→12',
    lines: ['설암 수술 경험 성인 여성 대상 연구에서', '14회기 미술치료 후 우울 척도가 55점→12점으로 감소.', '극심한 우울에서 경미한 수준으로 완화.', '그림을 그리는 행위 자체가 치유가 된다.'],
    accent: '#7D3C98',
    photoSeed: 'watercolor-painting-brush-therapy',
  },
  {
    id: 20, themeLabel: '작품이 주는 효과',
    title: '병원에 그림을 걸면\n생기는 일',
    lines: ['건보 일산병원은 36점 미술작품 전시로', '환자·직원에게 심리적 안정을 제공했다.', '코크란 연합 연구에서도 감각적 환경(미술·음악)이', '불안 완화에 도움이 되는 것으로 나타났다.'],
    accent: '#1A5276',
    photoSeed: 'hospital-corridor-calm-light',
  },
  {
    id: 21, themeLabel: '작품이 주는 효과',
    title: '사무실 그림이\n창의력을 높인다',
    lines: ['업무 공간의 회화는 감각과 사고를 일깨우는 통로.', '영국 엑서터 대학 연구: 식물·그림이 있는 사무실', '직원 생산성 15% 상승.', '초연결 사회 속 정서적 단절을 예술이 회복시킨다.'],
    accent: '#145A32',
    photoSeed: 'modern-office-plants-creative',
  },
  {
    id: 22, themeLabel: '현대미술 이슈',
    title: '2025 경매 TOP 3\n전부 클림트',
    lines: ["구스타프 클림트 '엘리자베스 레더러의 초상'", '— 2억 3,630만 달러(약 3,250억 원).', "'꽃이 만발한 초원' 8,600만 달러.", "'아터제 호숫가의 숲길' 6,830만 달러."],
    accent: '#7D6608',
    photoSeed: 'gold-texture-klimt-luxury',
  },
  {
    id: 23, themeLabel: '현대미술 이슈',
    title: 'AI가 그린 그림,\n예술일까?',
    lines: ['2022년 AI 생성 이미지가 미국 미술대회에서 1위.', '화가들의 반발 → 저작권 소송 연쇄 발생.', '"도구냐 창작자냐" 논쟁은 여전히 진행 중.', '카메라가 등장했을 때와 같은 역사가 반복되고 있다.'],
    accent: '#1C2833',
    photoSeed: 'artificial-intelligence-digital-art',
  },
  {
    id: 24, themeLabel: '현대미술 이슈',
    title: '현대미술이\n어려운 진짜 이유',
    lines: ['19세기까지 미술의 기준은 "얼마나 잘 그렸는가".', '20세기 뒤샹이 변기를 전시하며 기준이 바뀌었다.', '"이것이 왜 예술인가?"라는 질문 자체가 작품.', '현대미술은 정답이 아니라 질문을 감상하는 것.'],
    accent: '#4A235A',
    photoSeed: 'modern-art-gallery-abstract-sculpture',
  },
  {
    id: 25, themeLabel: '미술품 있는 집',
    title: '그림 한 점이\n거실을 바꾼다',
    lines: ['미술품은 비용·시간 부담 없이', '집의 분위기를 크게 바꿀 수 있는 가장 쉬운 방법.', '눈높이에 맞춰 걸기만 해도', '갤러리 같은 공간 연출이 가능하다.'],
    accent: '#7D6608',
    photoSeed: 'living-room-art-wall-modern',
  },
  {
    id: 26, themeLabel: '미술품 있는 집',
    title: '미니멀리즘\n인테리어의 함정',
    lines: ['비우기만 하면 미니멀? 아니다.', '진짜 미니멀리즘은 "무엇을 남길 것인가"의 선택.', '텅 빈 벽보다 작품 한 점이 있는 벽이', '공간에 이야기를 만든다.'],
    accent: '#2C3E50',
    photoSeed: 'minimal-room-white-wall-empty',
  },
  {
    id: 27, themeLabel: '미술품 있는 집',
    title: '북유럽에\n그림이 필수인 이유',
    lines: ['스칸디나비아의 긴 겨울, 짧은 낮.', '실내에 머무는 시간이 길수록 벽의 역할이 커진다.', '"히게(Hygge)" 문화의 핵심 — 따뜻한 조명과 벽의 작품.', '북유럽 가정의 86%가 벽에 무언가를 건다.'],
    accent: '#1A5276',
    photoSeed: 'scandinavian-interior-cozy-warm',
  },
  {
    id: 28, themeLabel: '아트 라이프 팁',
    title: '나만의 갤러리 월\n만들기 5단계',
    lines: ['1. 벽 면적 측정 → 프레임 배치 레이아웃 결정', '2. 테마 선정 (색감, 시대, 분위기 통일)', '3. 바닥에 먼저 배치해보기', '4. 중심 작품부터 걸기 → 간격 5~8cm 유지', '5. 조명 추가 — 스팟 또는 간접조명'],
    accent: '#6C3483',
    photoSeed: 'gallery-wall-frames-pictures',
  },
  {
    id: 29, themeLabel: '아트 라이프 팁',
    title: '그림으로\n계절을 바꾸는 법',
    lines: ['봄: 파스텔 톤의 꽃·자연 작품', '여름: 시원한 블루·그린 추상화', '가을: 따뜻한 오렌지·브라운 풍경화', '겨울: 모노톤·미니멀 작품', '같은 벽, 다른 그림 — 사계절이 바뀐다.'],
    accent: '#0E6655',
    photoSeed: 'four-seasons-nature-landscape',
  },
  {
    id: 30, themeLabel: '아트 라이프 팁',
    title: '카페에 그림 한 점이면\n분위기가 달라진다',
    lines: ['공간 브랜딩의 가장 쉬운 방법 — 벽의 작품.', '작품이 있는 카페는 체류 시간이 길어지고,', 'SNS 촬영 포인트가 되어 자연스러운 홍보 효과.', '비용 대비 가장 높은 ROI의 인테리어 요소.'],
    accent: '#922B21',
    photoSeed: 'cafe-interior-cozy-artwork',
  },
];

/** 이미지 사전 다운로드 → base64 */
async function downloadAsBase64(url) {
  try {
    const res = await fetch(url, { redirect: 'follow', signal: AbortSignal.timeout(12000) });
    if (!res.ok) return null;
    const buf = await res.arrayBuffer();
    const base64 = Buffer.from(buf).toString('base64');
    const ct = res.headers.get('content-type') || 'image/jpeg';
    return `data:${ct};base64,${base64}`;
  } catch {
    return null;
  }
}

/** hex → 어둡게 */
function darken(hex, amount) {
  const n = hex.replace('#', '');
  const r = Math.max(0, parseInt(n.slice(0, 2), 16) * (1 - amount));
  const g = Math.max(0, parseInt(n.slice(2, 4), 16) * (1 - amount));
  const b = Math.max(0, parseInt(n.slice(4, 6), 16) * (1 - amount));
  return `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`;
}

/** 카드 HTML 생성 — 사진 배경 + 다크 오버레이 + 볼드 흰색 텍스트 */
function cardHtml(card, imageDataUri) {
  const photoUrl = imageDataUri || `https://picsum.photos/seed/${card.photoSeed}/${WIDTH}/${HEIGHT}`;
  const titleHtml = card.title.replace(/\n/g, '<br>');
  const linesHtml = card.lines.map(l => `<p>${l}</p>`).join('\n');

  return `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<style>
  @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;700;800;900&family=Outfit:wght@600;700;800&display=swap');

  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    width: ${WIDTH}px;
    height: ${HEIGHT}px;
    overflow: hidden;
    font-family: 'Noto Sans KR', sans-serif;
  }

  .card {
    width: ${WIDTH}px;
    height: ${HEIGHT}px;
    position: relative;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    color: #fff;
  }

  /* 배경 이미지 + 그라데이션 폴백 */
  .card-bg {
    position: absolute;
    inset: 0;
    background-image: url('${photoUrl}');
    background-size: cover;
    background-position: center;
    background-color: ${card.accent};
  }

  /* 다크 오버레이 */
  .card-overlay {
    position: absolute;
    inset: 0;
    background: linear-gradient(
      180deg,
      rgba(0,0,0,0.5) 0%,
      rgba(0,0,0,0.55) 30%,
      rgba(0,0,0,0.72) 100%
    );
  }

  .card-content {
    position: relative;
    z-index: 2;
    flex: 1;
    padding: 80px 72px 88px;
    display: flex;
    flex-direction: column;
  }

  .theme {
    font-family: 'Outfit', 'Noto Sans KR', sans-serif;
    font-size: 18px;
    font-weight: 800;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: #fff;
    opacity: 0.9;
    margin-bottom: 12px;
  }

  .theme-line {
    width: 48px;
    height: 4px;
    background: rgba(255,255,255,0.7);
    margin-bottom: 48px;
    border-radius: 2px;
  }

  .title {
    font-family: 'Noto Sans KR', sans-serif;
    font-size: 54px;
    font-weight: 900;
    line-height: 1.28;
    margin-bottom: 56px;
    color: #fff;
    text-shadow:
      0 2px 4px rgba(0,0,0,0.6),
      0 4px 20px rgba(0,0,0,0.4);
    letter-spacing: -0.01em;
  }

  .lines {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 22px;
    font-size: 25px;
    line-height: 1.6;
    font-weight: 700;
    color: #fff;
    text-shadow:
      0 1px 3px rgba(0,0,0,0.7),
      0 2px 10px rgba(0,0,0,0.3);
  }

  .lines p { margin: 0; }

  .footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: auto;
    padding-top: 36px;
    border-top: 1px solid rgba(255,255,255,0.15);
  }

  .brand {
    font-family: 'Outfit', sans-serif;
    font-size: 18px;
    font-weight: 800;
    letter-spacing: 0.35em;
    text-transform: uppercase;
    color: #fff;
    opacity: 0.6;
  }

  .number {
    font-family: 'Outfit', sans-serif;
    font-size: 16px;
    font-weight: 700;
    color: #fff;
    opacity: 0.5;
  }
</style>
</head>
<body>
  <div class="card" data-card>
    <div class="card-bg"></div>
    <div class="card-overlay"></div>
    <div class="card-content">
      <span class="theme">${card.themeLabel}</span>
      <div class="theme-line"></div>
      <h1 class="title">${titleHtml}</h1>
      <div class="lines">
        ${linesHtml}
      </div>
      <div class="footer">
        <span class="brand">Silvertape</span>
        <span class="number">${card.id} / 30</span>
      </div>
    </div>
  </div>
</body>
</html>`;
}

async function main() {
  let puppeteer;
  try {
    puppeteer = await import('puppeteer');
  } catch {
    console.error('puppeteer가 필요합니다: npm install puppeteer');
    process.exit(1);
  }

  await mkdir(OUT_DIR, { recursive: true });

  console.log(`\\n카드뉴스 ${CARDS.length}장 생성 시작...`);
  console.log(`출력: ${OUT_DIR}\\n`);

  // 1단계: 사진 사전 다운로드 (base64)
  console.log('사진 다운로드 중...');
  const imageMap = new Map();
  const downloadPromises = CARDS.map(async (card) => {
    const url = `https://picsum.photos/seed/${card.photoSeed}/${WIDTH}/${HEIGHT}`;
    const dataUri = await downloadAsBase64(url);
    if (dataUri) {
      imageMap.set(card.id, dataUri);
      process.stdout.write('.');
    } else {
      process.stdout.write('x');
    }
  });
  // 5개씩 병렬 다운로드
  for (let i = 0; i < downloadPromises.length; i += 5) {
    await Promise.all(downloadPromises.slice(i, i + 5));
  }
  console.log(`\\n사진 ${imageMap.size}/${CARDS.length}장 다운로드 완료\\n`);

  const browser = await puppeteer.default.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: WIDTH, height: HEIGHT, deviceScaleFactor: 1 });

  let success = 0;
  for (const card of CARDS) {
    try {
      const html = cardHtml(card, imageMap.get(card.id));

      // domcontentloaded로 빠르게 로드, 이미지/폰트는 별도 대기
      await page.setContent(html, { waitUntil: 'domcontentloaded', timeout: 10000 });

      // 폰트 + 이미지 로딩 대기 (최대 8초, 실패해도 진행)
      await Promise.race([
        page.evaluate(async () => {
          await document.fonts.ready;
          // 배경 이미지 로딩 대기
          await new Promise((resolve) => {
            const img = new Image();
            const bgEl = document.querySelector('.card-bg');
            const style = bgEl ? getComputedStyle(bgEl).backgroundImage : '';
            const match = style.match(/url\\("?([^"]*)"?\\)/);
            if (match) {
              img.onload = resolve;
              img.onerror = resolve; // 실패해도 진행 (gradient fallback)
              img.src = match[1];
            } else {
              resolve(undefined);
            }
          });
        }),
        new Promise(r => setTimeout(r, 8000)),
      ]);

      // 렌더링 안정화 대기
      await new Promise(r => setTimeout(r, 300));

      const filePath = join(OUT_DIR, `card-${String(card.id).padStart(2, '0')}.png`);

      const cardEl = await page.$('[data-card]');
      if (cardEl) {
        await cardEl.screenshot({ path: filePath });
      } else {
        await page.screenshot({ path: filePath, clip: { x: 0, y: 0, width: WIDTH, height: HEIGHT } });
      }

      success++;
      console.log(`  ✓ card-${String(card.id).padStart(2, '0')}.png  (${card.themeLabel}: ${card.title.split('\\n')[0]})`);
    } catch (err) {
      console.error(`  ✗ card-${String(card.id).padStart(2, '0')}.png  ERROR: ${err.message}`);
    }
  }

  await browser.close();
  console.log(`\\n완료! ${success}/${CARDS.length}장 생성됨 → ${OUT_DIR}\\n`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
