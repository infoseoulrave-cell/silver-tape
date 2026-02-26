#!/usr/bin/env node
/**
 * 인스타그램 카드뉴스 30토픽 × 3장 = 90장 PNG 생성
 * 사진 배경 + 다크 오버레이 + 큰 볼드 흰색 텍스트
 *
 * 사용: node scripts/generate-card-news-images.mjs
 * 필요: puppeteer
 */

import { mkdir } from 'fs/promises';
import { join } from 'path';

const OUT_DIR = join(process.cwd(), 'public', 'instagram', 'card-news');
const WIDTH = 1080;
const HEIGHT = 1350;

/**
 * 30개 토픽, 각 3슬라이드
 * slide1: 표지 (테마 + 큰 제목)
 * slide2: 본문 전반부
 * slide3: 본문 후반부 + 마무리
 */
const TOPICS = [
  {
    id: 1, themeLabel: '과거의 물감', accent: '#8B4513', photoId: 10,
    slide1: { title: '1만 9천 년 전,\n동굴 벽화의\n색은?' },
    slide2: {
      heading: '천연광물로 그린 최초의 그림',
      lines: [
        '라스코 동굴 벽화는 약 1만 9천 년 전 작품이다.',
        '사용한 안료는 오직 네 가지.',
        '',
        '빨강 — 산화철(적철석)을 갈아서',
        '노랑 — 황토(리모나이트)',
        '검정 — 이산화망간 또는 숯',
        '흰색 — 석회석 또는 백악',
      ],
    },
    slide3: {
      heading: '왜 이 그림들이 중요할까?',
      lines: [
        '유기물 안료를 쓰지 않았기에',
        '탄소연대측정이 불가능했다.',
        '',
        '대신 동굴에서 발견된 뼈와 숯을',
        '분석해 연대를 추정했다.',
        '',
        '인류 최초의 "미술 재료"는',
        '발밑의 돌과 흙이었다.',
      ],
    },
  },
  {
    id: 2, themeLabel: '과거의 물감', accent: '#6C3483', photoId: 110,
    slide1: { title: '보라색이\n금만큼\n비쌌던 시대' },
    slide2: {
      heading: '뿔고둥 25만 마리의 피',
      lines: [
        '티리언 퍼플(Tyrian Purple)은',
        '뿔고둥의 점액선에서 추출한 염료.',
        '',
        '옷 한 벌 염색에',
        '바다달팽이 25만 마리가 필요했다.',
        '',
        '금 1g보다 10~20배 비싼 가격.',
      ],
    },
    slide3: {
      heading: '"로얄 퍼플"의 탄생',
      lines: [
        '4세기 이후 로마 제국에서는',
        '황제만이 이 색을 입을 수 있었다.',
        '',
        '법으로 금지된 색 — 보라.',
        '"로얄 퍼플"이라는 이름이 여기서 유래.',
        '',
        '1856년 합성 염료가 발명되기 전까지',
        '보라색은 진짜 권력의 상징이었다.',
      ],
    },
  },
  {
    id: 3, themeLabel: '과거의 물감', accent: '#C0392B', photoId: 169,
    slide1: { title: '유화가\n르네상스를\n바꿨다' },
    slide2: {
      heading: '계란에서 기름으로',
      lines: [
        '15세기 이전, 화가들은 템페라를 썼다.',
        '계란 노른자 + 안료.',
        '',
        '문제는? 너무 빨리 마르고',
        '수정이 거의 불가능했다.',
        '',
        '얀 판 에이크가 유화를 보편화하면서',
        '세밀한 명암과 색채 표현이 가능해졌다.',
      ],
    },
    slide3: {
      heading: '유화 혁명의 상징',
      lines: [
        "'아르놀피니의 결혼식'(1434) —",
        '유화의 가능성을 처음 보여준 작품.',
        '',
        '거울에 비친 뒷모습,',
        '샹들리에의 금속 광택,',
        '직물의 질감까지.',
        '',
        '이 모든 표현이 유화 덕분에 가능했다.',
      ],
    },
  },
  {
    id: 4, themeLabel: '과거의 물감', accent: '#7D6608', photoId: 180,
    slide1: { title: '물감이\n튜브에\n담기기까지' },
    slide2: {
      heading: '돼지 방광에서 금속 튜브로',
      lines: [
        '1824년 이전, 화가들은',
        '돼지 방광에 물감을 보관했다.',
        '',
        '물감이 쉽게 굳고, 들고 다니기 불편했다.',
        '야외 작업? 거의 불가능.',
        '',
        '영국의 윌리엄 윈저가',
        '접이식 금속 튜브를 발명하면서 모든 게 바뀌었다.',
      ],
    },
    slide3: {
      heading: '"튜브가 없었다면\n인상파도 없었다"',
      lines: [
        '르누아르의 말이다.',
        '',
        '튜브 덕분에 화가들은',
        '아틀리에를 나와 강변으로,',
        '정원으로, 카페 테라스로 갔다.',
        '',
        '인상주의의 탄생은',
        '기술 혁신의 결과이기도 하다.',
      ],
    },
  },
  {
    id: 5, themeLabel: '색의 심리학', accent: '#C0392B', photoId: 206,
    slide1: { title: '빨강이\n심박수를\n올린다' },
    slide2: {
      heading: '교감신경을 자극하는 색',
      lines: [
        '빨간색을 보면 교감신경이 활성화된다.',
        '',
        '심박수 증가',
        '혈압 상승',
        '주의력 집중',
        '각성 수준 상승',
        '',
        '열정과 에너지, 동시에 분노와 위험.',
      ],
    },
    slide3: {
      heading: '빨강의 전략적 사용',
      lines: [
        '패스트푸드 브랜드의 70% 이상이',
        '빨간색 로고를 사용한다.',
        '',
        '식욕을 자극하고',
        '빠른 의사결정을 유도하기 때문.',
        '',
        '코카콜라, 맥도날드, KFC —',
        '빨강은 가장 상업적인 색이다.',
      ],
    },
  },
  {
    id: 6, themeLabel: '색의 심리학', accent: '#1A5276', photoId: 239,
    slide1: { title: '파랑은 왜\n신뢰의\n색일까?' },
    slide2: {
      heading: '부교감신경과 파란색',
      lines: [
        '파란색은 부교감신경을 촉진해',
        '마음을 안정시킨다.',
        '',
        '심박수를 낮추고',
        '스트레스 호르몬을 줄이며',
        '집중력을 높이는 효과가',
        '여러 연구로 확인됐다.',
      ],
    },
    slide3: {
      heading: '세계에서 가장 인기 있는 색',
      lines: [
        '페이스북, 삼성, IBM, 비자, HP —',
        '글로벌 기업 로고에 파랑이 많은 이유.',
        '',
        '신뢰, 안정, 전문성의 이미지.',
        '',
        '전 세계 설문에서',
        '남녀 모두 가장 선호하는 색 1위 —',
        '바로 파랑이다.',
      ],
    },
  },
  {
    id: 7, themeLabel: '색의 심리학', accent: '#145A32', photoId: 15,
    slide1: { title: '초록이 눈을\n편하게 하는\n과학적 이유' },
    slide2: {
      heading: '가시광선의 정중앙',
      lines: [
        '초록색 빛의 파장은 약 520nm.',
        '가시광선 스펙트럼의 정중앙이다.',
        '',
        '눈의 수정체가',
        '가장 적은 에너지로 초점을 맞출 수 있어',
        '피로가 적다.',
        '',
        '수술실 가운이 초록인 이유이기도 하다.',
      ],
    },
    slide3: {
      heading: '자연의 색이 치유하는 힘',
      lines: [
        '도시에 녹지가 10% 늘어나면',
        '주민의 스트레스 지수가 유의미하게 감소한다.',
        '',
        '초록은 자연을 연상시키고',
        '심리적 안정감과 회복 효과를 준다.',
        '',
        '"숲속 30분"이 항우울제보다',
        '효과적이라는 연구도 있다.',
      ],
    },
  },
  {
    id: 8, themeLabel: '미술사 미스터리', accent: '#4A235A', photoId: 36,
    slide1: { title: '모나리자 도난:\n루브르가\n빈 벽을\n전시한 날' },
    slide2: {
      heading: '1911년 8월 21일',
      lines: [
        '루브르 박물관 직원 빈센초 페루자.',
        '이탈리아 출신 유리 장인.',
        '',
        '월요일 휴관일에 박물관에 숨어 있다가',
        '모나리자를 통째로 들고 나왔다.',
        '',
        '경비원은 아무도 눈치채지 못했다.',
      ],
    },
    slide3: {
      heading: '빈 벽을 보러 온 사람들',
      lines: [
        '페루자는 2년간 자기 아파트',
        '트렁크 속에 모나리자를 숨겼다.',
        '',
        '이탈리아 화상에게 팔려다 체포.',
        '',
        '도난 소식이 알려지자',
        '루브르 방문객이 2배로 늘었다.',
        '그들은 빈 벽을 보러 왔다.',
      ],
    },
  },
  {
    id: 9, themeLabel: '미술사 미스터리', accent: '#922B21', photoId: 60,
    slide1: { title: '5억 달러의\n미술품이\n아직도\n사라진 채' },
    slide2: {
      heading: '1990년 3월 18일, 보스턴',
      lines: [
        '새벽 1시 24분.',
        '경찰 복장의 남자 2명이',
        '이사벨라 스튜어트 가드너 박물관에 도착.',
        '',
        '"야간 순찰입니다."',
        '',
        '경비원은 문을 열어주었다.',
        '81분 후, 그들은 13점의 작품과 함께 사라졌다.',
      ],
    },
    slide3: {
      heading: '35년째 빈 액자',
      lines: [
        '렘브란트 3점, 베르메르 1점,',
        '드가 5점, 마네 1점 등 총 13점.',
        '',
        '추정 가치 5억 달러 —',
        '역사상 최대 규모의 미술품 절도.',
        '',
        '박물관은 빈 액자를 그대로 걸어두었다.',
        '"돌아올 때까지 자리를 지키겠다."',
      ],
    },
  },
  {
    id: 10, themeLabel: '미술사 미스터리', accent: '#0E6655', photoId: 65,
    slide1: { title: '"인상주의"\n라는 이름은\n조롱이었다' },
    slide2: {
      heading: '살롱에서 거부당한 화가들',
      lines: [
        '1874년, 파리.',
        '모네, 르누아르, 드가, 피사로 등',
        '30명의 화가가 독립 전시회를 열었다.',
        '',
        '공식 살롱전에서 거부당한 뒤',
        '사진작가 나다르의 스튜디오를 빌린 것.',
        '',
        '세상은 이들을 비웃었다.',
      ],
    },
    slide3: {
      heading: '조롱에서 혁명으로',
      lines: [
        '비평가 루이 르루아가',
        "모네의 '인상, 해돋이'를 보고 말했다.",
        '',
        '"인상주의자! 벽지도 이것보단 완성도가 높다."',
        '',
        '조롱으로 붙인 이름이',
        '미술사에서 가장 사랑받는',
        '사조의 이름이 되었다.',
      ],
    },
  },
  {
    id: 11, themeLabel: '화가 이야기', accent: '#7D6608', photoId: 83,
    slide1: { title: '고흐,\n생전에\n팔린 그림은\n단 1점' },
    slide2: {
      heading: '900점의 그림, 1점의 판매',
      lines: [
        '빈센트 반 고흐(1853–1890)',
        '10년 동안 약 900점의 그림을 그렸다.',
        '',
        '생전에 팔린 것은 단 1점.',
        "'아를의 붉은 포도밭' — 400프랑.",
        '',
        '동생 테오의 친구가 구매했다.',
        '오늘날 환산하면 약 200만 원.',
      ],
    },
    slide3: {
      heading: '사후의 역설',
      lines: [
        '37세에 세상을 떠난 고흐.',
        '',
        "사후 '별이 빛나는 밤'은",
        'MoMA의 가장 유명한 작품이 되었고,',
        '',
        "'의사 가셰의 초상'은",
        '1990년 8,250만 달러에 낙찰.',
        '',
        '살아서 인정받지 못한 천재의 대명사.',
      ],
    },
  },
  {
    id: 12, themeLabel: '화가 이야기', accent: '#2C3E50', photoId: 119,
    slide1: { title: '다빈치 vs\n미켈란젤로:\n세기의\n라이벌' },
    slide2: {
      heading: '1504년 피렌체의 대결',
      lines: [
        '피렌체 시청사(베키오 궁전)',
        '양쪽 벽화를 동시에 의뢰받았다.',
        '',
        "다빈치 — '앙기아리 전투'",
        "미켈란젤로 — '카시나 전투'",
        '',
        '두 거장이 같은 건물에서',
        '동시에 작업한 전무후무한 사건.',
      ],
    },
    slide3: {
      heading: '미완의 걸작들',
      lines: [
        '다빈치는 실험적 기법이 실패해 중단.',
        '미켈란젤로는 교황의 부름으로 로마로 떠났다.',
        '',
        '둘 다 미완성으로 끝났지만',
        '예비 스케치를 본 사람들은 말했다:',
        '',
        '"두 작품 모두 완성됐다면',
        '르네상스 최고의 걸작이었을 것."',
      ],
    },
  },
  {
    id: 13, themeLabel: '화가 이야기', accent: '#C0392B', photoId: 142,
    slide1: { title: '프리다 칼로:\n고통이\n만든 예술' },
    slide2: {
      heading: '18세, 교통사고',
      lines: [
        '1925년, 멕시코시티.',
        '버스가 전차와 충돌했다.',
        '',
        '척추 3곳 골절, 쇄골 골절,',
        '갈비뼈 2개 골절, 골반 3곳 골절.',
        '오른발 11곳 골절.',
        '',
        '프리다 칼로, 18세.',
      ],
    },
    slide3: {
      heading: '"나는 나 자신을 그린다"',
      lines: [
        '평생 30번 이상의 수술.',
        '침대에 거울을 달고 자화상을 그렸다.',
        '',
        '143점의 작품 중 55점이 자화상.',
        '',
        '"나는 혼자 있는 시간이 많고,',
        '내가 가장 잘 아는 주제를 그린다 —',
        '나 자신."',
      ],
    },
  },
  {
    id: 14, themeLabel: '화가 이야기', accent: '#E74C3C', photoId: 164,
    slide1: { title: "뭉크 '절규'\n속 하늘의\n비밀" },
    slide2: {
      heading: '1883년 화산 폭발',
      lines: [
        '인도네시아 크라카타우 화산 대폭발.',
        'TNT 200메가톤 — 히로시마 원폭의 1만 배.',
        '',
        '분출된 화산재가 성층권에 도달,',
        '전 세계 하늘을 물들였다.',
        '',
        '유럽에서도 수개월간',
        '핏빛 석양이 관측되었다.',
      ],
    },
    slide3: {
      heading: '뭉크가 본 하늘',
      lines: [
        '노르웨이 오슬로, 에케베르그 언덕.',
        '',
        '"갑자기 하늘이 핏빛으로 변했다.',
        '나는 멈춰 서서 극도의 피로를 느끼며',
        '난간에 기대었다 — 피와 불의 혀가',
        '검푸른 피오르드 위로 뻗어 있었다."',
        '',
        '— 뭉크의 일기, 1892년',
      ],
    },
  },
  {
    id: 15, themeLabel: '디지털 vs 필름', accent: '#1C2833', photoId: 250,
    slide1: { title: '필름은 화학,\n디지털은\n전기' },
    slide2: {
      heading: '완전히 다른 기록 방식',
      lines: [
        '필름 — 빛이 은염(할로겐화은) 입자에',
        '화학 반응을 일으켜 상을 기록.',
        '',
        '디지털 — 이미지 센서(CMOS/CCD)가',
        '빛을 전기 신호로 변환해 저장.',
        '',
        '같은 "사진"이지만',
        '물리적 과정이 완전히 다르다.',
      ],
    },
    slide3: {
      heading: '그레인 vs 노이즈',
      lines: [
        '필름의 그레인(grain):',
        '은 입자 크기의 자연스러운 불규칙성.',
        '감성적이고 유기적인 질감.',
        '',
        '디지털의 노이즈(noise):',
        '전기 신호의 무작위 오류.',
        '균일하고 기계적인 패턴.',
        '',
        '같은 "거칠음"이지만 미학이 다르다.',
      ],
    },
  },
  {
    id: 16, themeLabel: '디지털 vs 필름', accent: '#7D3C98', photoId: 256,
    slide1: { title: 'MZ세대가\n필름을\n다시 찾는 이유' },
    slide2: {
      heading: '숫자로 보는 필름 부활',
      lines: [
        '한국후지필름 일회용 카메라',
        '판매량 전년 대비 200% 증가.',
        '',
        '니콘 헤리티지 라인',
        '10~30대 구매 비중 40%→61%.',
        '',
        '코닥 필름 생산량',
        '2020년 대비 3배 증가.',
      ],
    },
    slide3: {
      heading: '"있는 그대로"의 가치',
      lines: [
        '스마트폰의 AI 보정에 피로감.',
        '지나치게 선명하고 완벽한 이미지.',
        '',
        '필름은 한 장 한 장의 무게가 있다.',
        '찍기 전에 생각하게 만든다.',
        '',
        '과정 자체가 목적이 되는 촬영 —',
        '그것이 필름의 매력이다.',
      ],
    },
  },
  {
    id: 17, themeLabel: '사진 예술', accent: '#2C3E50', photoId: 274,
    slide1: { title: '흑백사진이\n더 감성적인\n이유' },
    slide2: {
      heading: '색을 빼면 감정이 들어온다',
      lines: [
        '색을 제거하면',
        '빛과 그림자, 형태에 집중하게 된다.',
        '',
        '뇌가 색 정보 처리에 쓰던 에너지가',
        '감정 해석으로 이동한다는 연구.',
        '',
        '흑백은 현실과 거리를 두어',
        '추상적 아름다움을 만든다.',
      ],
    },
    slide3: {
      heading: '흑백으로 시대를 기록한 거장들',
      lines: [
        '앙리 카르티에 브레송 —',
        '"결정적 순간"을 포착한 사진의 시인.',
        '',
        '안셀 아담스 —',
        '요세미티를 흑백으로 영원히 남긴 풍경 대가.',
        '',
        '도로시아 랭 —',
        '대공황의 아픔을 흑백으로 증언한 기록자.',
      ],
    },
  },
  {
    id: 18, themeLabel: '사진 예술', accent: '#4A235A', photoId: 287,
    slide1: { title: '세계에서\n가장 비싼\n사진 작품' },
    slide2: {
      heading: 'TOP 3 사진 경매가',
      lines: [
        '1위. 만 레이',
        "'Le Violon d'Ingres' — 1,240만 달러(2022)",
        '',
        '2위. 신디 셔먼',
        "'Untitled #96' — 389만 달러",
        '',
        '3위. 에드워드 스타이컨',
        "'The Pond—Moonlight' — 292만 달러",
      ],
    },
    slide3: {
      heading: '사진도 회화와 같은 예술',
      lines: [
        '1세기 반 전, 사진이 처음 등장했을 때',
        '화가들은 "기계의 복제"라며 반발했다.',
        '',
        '오늘날 사진 한 장이',
        '웬만한 유화보다 비싸다.',
        '',
        '"예술이냐 아니냐"의 논쟁은',
        '항상 새로운 매체에서 반복된다.',
      ],
    },
  },
  {
    id: 19, themeLabel: '작품이 주는 효과', accent: '#7D3C98', photoId: 306,
    slide1: { title: '미술치료:\n우울 점수\n55→12' },
    slide2: {
      heading: '임상 연구 결과',
      lines: [
        '설암 수술 경험 성인 여성 대상 연구.',
        '',
        '14회기 미술치료 후',
        '벡 우울 척도(BDI):',
        '55점(극심한 우울) → 12점(경미한 수준)',
        '',
        '78%의 감소율.',
        '약물 치료 없이 미술 활동만으로.',
      ],
    },
    slide3: {
      heading: '그리는 행위 자체가 치유',
      lines: [
        '미술치료의 핵심은',
        '작품의 완성도가 아니다.',
        '',
        '손을 움직이고, 색을 고르고,',
        '감정을 형태로 표현하는 과정 자체가',
        '정서적 정화(카타르시스)를 일으킨다.',
        '',
        '말로 표현할 수 없는 것을',
        '그림으로 꺼내는 힘.',
      ],
    },
  },
  {
    id: 20, themeLabel: '작품이 주는 효과', accent: '#1A5276', photoId: 316,
    slide1: { title: '병원에\n그림을 걸면\n생기는 일' },
    slide2: {
      heading: '의료 환경과 예술',
      lines: [
        '건보 일산병원 —',
        '36점의 미술작품을 복도와 병실에 전시.',
        '',
        '환자 설문 결과:',
        '심리적 안정감 유의미하게 상승.',
        '불안감 감소, 회복 의지 증가.',
        '',
        '직원들의 업무 만족도도 함께 올랐다.',
      ],
    },
    slide3: {
      heading: '코크란 연합의 결론',
      lines: [
        '국제 의료 연구 기관 코크란 연합.',
        '',
        '체계적 문헌 고찰 결과:',
        '감각적 환경(미술, 음악, 자연광)이',
        '환자의 불안 완화와 통증 인식 감소에',
        '도움이 되는 것으로 나타났다.',
        '',
        '치료 환경도 치료의 일부다.',
      ],
    },
  },
  {
    id: 21, themeLabel: '작품이 주는 효과', accent: '#145A32', photoId: 326,
    slide1: { title: '사무실 그림이\n창의력을\n높인다' },
    slide2: {
      heading: '엑서터 대학의 실험',
      lines: [
        '영국 엑서터 대학교(2010) 연구.',
        '',
        '실험 조건:',
        'A그룹 — 텅 빈 사무실',
        'B그룹 — 식물과 그림이 있는 사무실',
        '',
        '결과:',
        'B그룹의 생산성이 15% 높았다.',
      ],
    },
    slide3: {
      heading: '예술이 회복시키는 것',
      lines: [
        '화면만 보는 디지털 피로 시대.',
        '',
        '벽의 그림 한 점은',
        '시선을 쉬게 하고,',
        '감각을 일깨우며,',
        '정서적 단절을 회복시킨다.',
        '',
        '사무실의 그림은 장식이 아니라 도구다.',
      ],
    },
  },
  {
    id: 22, themeLabel: '현대미술 이슈', accent: '#7D6608', photoId: 338,
    slide1: { title: '2025 경매\nTOP 3\n전부 클림트' },
    slide2: {
      heading: '구스타프 클림트의 해',
      lines: [
        '1위. "엘리자베스 레더러의 초상"',
        '2억 3,630만 달러 (약 3,250억 원)',
        '',
        '2위. "꽃이 만발한 초원"',
        '8,600만 달러',
        '',
        '3위. "아터제 호숫가의 숲길"',
        '6,830만 달러',
      ],
    },
    slide3: {
      heading: '왜 지금 클림트인가',
      lines: [
        '세 작품 모두 같은 컬렉션에서 나왔다.',
        '나치에 약탈당했다 반환된 작품들.',
        '',
        '역사적 스토리가 작품 가치를 높인다.',
        '',
        '금박, 장식적 패턴, 관능적 인물화 —',
        '100년 전 작품이 2025년에도',
        '시장을 지배하고 있다.',
      ],
    },
  },
  {
    id: 23, themeLabel: '현대미술 이슈', accent: '#1C2833', photoId: 350,
    slide1: { title: 'AI가\n그린 그림,\n예술일까?' },
    slide2: {
      heading: '2022년, 논쟁의 시작',
      lines: [
        'AI 이미지 생성 도구 Midjourney로 만든',
        '"Théâtre D\'Opéra Spatial"이',
        '콜로라도 주립 미술대회 디지털아트 부문 1위.',
        '',
        '작가 제이슨 앨런은',
        '프롬프트만 입력했을 뿐',
        '직접 붓을 들지 않았다.',
      ],
    },
    slide3: {
      heading: '도구냐, 창작자냐',
      lines: [
        '화가들의 반발 → 저작권 소송 연쇄 발생.',
        '',
        '"카메라가 처음 등장했을 때도',
        '화가들은 예술이 죽었다고 말했다."',
        '',
        '카메라는 새로운 예술을 만들었다.',
        'AI도 같은 길을 걸을까?',
        '',
        '역사는 아직 답을 내리지 않았다.',
      ],
    },
  },
  {
    id: 24, themeLabel: '현대미술 이슈', accent: '#4A235A', photoId: 370,
    slide1: { title: '현대미술이\n어려운\n진짜 이유' },
    slide2: {
      heading: '기준이 바뀌었다',
      lines: [
        '19세기까지 미술의 기준:',
        '"얼마나 잘 그렸는가."',
        '',
        '1917년, 마르셀 뒤샹.',
        '남성용 소변기에 "R. Mutt"라고 서명하고',
        '"분수(Fountain)"라는 제목을 붙였다.',
        '',
        '"이것이 왜 예술인가?"라는',
        '질문 자체가 작품이 되었다.',
      ],
    },
    slide3: {
      heading: '정답이 아니라 질문을 감상하는 것',
      lines: [
        '현대미술은 "아름다움"을',
        '보여주지 않을 수도 있다.',
        '',
        '대신 불편함, 의문, 도발을 제시한다.',
        '',
        '"이해하려 하지 말고',
        '느끼는 대로 경험하라."',
        '',
        '현대미술 감상의 첫 번째 규칙이다.',
      ],
    },
  },
  {
    id: 25, themeLabel: '미술품 있는 집', accent: '#7D6608', photoId: 399,
    slide1: { title: '그림 한 점이\n거실을\n바꾼다' },
    slide2: {
      heading: '가장 쉬운 인테리어 변화',
      lines: [
        '가구를 바꾸면 시간과 비용이 크다.',
        '벽지를 바꾸면 공사가 필요하다.',
        '',
        '그림 한 점?',
        '못 하나면 된다.',
        '',
        '비용 대비 공간의 분위기를',
        '가장 크게 바꿀 수 있는 방법.',
      ],
    },
    slide3: {
      heading: '걸기만 해도 갤러리',
      lines: [
        '눈높이(바닥에서 145~155cm)에 맞춰 걸면',
        '자연스러운 시선 유도.',
        '',
        '소파 위? 소파 너비의 2/3 크기.',
        '복도? 연작을 일렬로 배치.',
        '',
        '규칙은 간단하다.',
        '벽이 비어 있다면,',
        '작품이 들어갈 자리다.',
      ],
    },
  },
  {
    id: 26, themeLabel: '미술품 있는 집', accent: '#2C3E50', photoId: 403,
    slide1: { title: '미니멀리즘\n인테리어의\n함정' },
    slide2: {
      heading: '비우기만 하면 미니멀?',
      lines: [
        '미니멀리즘의 오해:',
        '"아무것도 없는 것"이 미니멀.',
        '',
        '진짜 미니멀리즘:',
        '"무엇을 남길 것인가"의 선택.',
        '',
        '모든 것을 제거한 공간은',
        '미니멀이 아니라 공허하다.',
      ],
    },
    slide3: {
      heading: '텅 빈 벽 vs 작품 있는 벽',
      lines: [
        '미니멀한 공간에 작품 한 점을 걸면',
        '그 작품이 공간 전체를 정의한다.',
        '',
        '일본의 "토코노마(床の間)" 전통 —',
        '빈 공간에 꽃 한 송이, 족자 하나.',
        '',
        '여백이 있어야',
        '작품이 더 빛난다.',
      ],
    },
  },
  {
    id: 27, themeLabel: '미술품 있는 집', accent: '#1A5276', photoId: 416,
    slide1: { title: '북유럽에\n그림이\n필수인 이유' },
    slide2: {
      heading: '긴 겨울, 짧은 낮',
      lines: [
        '스칸디나비아의 겨울은 길다.',
        '스웨덴 북부 — 하루 해가 3시간.',
        '핀란드 — 12월 낮이 6시간.',
        '',
        '실내에 머무는 시간이 길어질수록',
        '벽의 역할이 커진다.',
        '',
        '벽은 창문 다음으로 많이 보는 면이다.',
      ],
    },
    slide3: {
      heading: '히게(Hygge)와 벽의 작품',
      lines: [
        '덴마크의 "히게" 문화 —',
        '아늑하고 따뜻한 분위기를 만드는 생활 철학.',
        '',
        '핵심 요소:',
        '따뜻한 조명, 촛불,',
        '그리고 벽의 작품.',
        '',
        '북유럽 가정의 86%가',
        '벽에 무언가를 건다.',
      ],
    },
  },
  {
    id: 28, themeLabel: '아트 라이프 팁', accent: '#6C3483', photoId: 429,
    slide1: { title: '나만의\n갤러리 월\n만들기' },
    slide2: {
      heading: '5단계 가이드',
      lines: [
        '1단계: 벽 면적 측정',
        '→ 프레임 배치 레이아웃 결정',
        '',
        '2단계: 테마 선정',
        '→ 색감, 시대, 분위기 통일',
        '',
        '3단계: 바닥에 먼저 배치',
        '→ 벽에 못을 박기 전에 시뮬레이션',
      ],
    },
    slide3: {
      heading: '완성의 디테일',
      lines: [
        '4단계: 중심 작품부터 걸기',
        '→ 가장 큰 작품을 중앙에 먼저 배치',
        '→ 나머지 작품 간격 5~8cm 유지',
        '',
        '5단계: 조명 추가',
        '→ 스팟 조명 or 간접 조명',
        '→ 작품에 빛이 닿으면 갤러리가 된다',
        '',
        '당신의 벽이 전시장이 된다.',
      ],
    },
  },
  {
    id: 29, themeLabel: '아트 라이프 팁', accent: '#0E6655', photoId: 433,
    slide1: { title: '그림으로\n계절을\n바꾸는 법' },
    slide2: {
      heading: '같은 벽, 다른 그림',
      lines: [
        '봄 — 파스텔 톤의 꽃 · 자연 작품',
        '→ 벚꽃, 연두, 라벤더',
        '',
        '여름 — 시원한 블루 · 그린 추상화',
        '→ 바다, 하늘, 열대 식물',
        '',
        '가을 — 따뜻한 오렌지 · 브라운 풍경화',
        '→ 단풍, 황금빛, 수확',
      ],
    },
    slide3: {
      heading: '4계절 인테리어 비법',
      lines: [
        '겨울 — 모노톤 · 미니멀 작품',
        '→ 눈, 은색, 고요한 풍경',
        '',
        '3개월마다 그림을 바꾸면',
        '집 전체의 무드가 바뀐다.',
        '',
        '큰 투자 없이 계절감을 연출하는',
        '가장 세련된 방법.',
      ],
    },
  },
  {
    id: 30, themeLabel: '아트 라이프 팁', accent: '#922B21', photoId: 437,
    slide1: { title: '카페에\n그림 한 점이면\n분위기가\n달라진다' },
    slide2: {
      heading: '공간 브랜딩의 가장 쉬운 방법',
      lines: [
        '작품이 있는 카페 vs 없는 카페.',
        '',
        '체류 시간: 평균 12분 더 길다.',
        'SNS 촬영 빈도: 3배 높다.',
        '재방문율: 유의미한 차이.',
        '',
        '벽의 작품이 곧 마케팅이다.',
      ],
    },
    slide3: {
      heading: '최고의 ROI 인테리어',
      lines: [
        '인테리어 공사 — 수백만 원.',
        '가구 교체 — 수십~수백만 원.',
        '그림 한 점 — 수만~수십만 원.',
        '',
        '비용 대비 공간 분위기를',
        '가장 크게 바꿀 수 있는 요소.',
        '',
        '작품은 소비가 아니라 투자다.',
      ],
    },
  },
];

/** 이미지 사전 다운로드 → base64 (최대 3회 재시도) */
async function downloadAsBase64(url, retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, { redirect: 'follow', signal: AbortSignal.timeout(25000) });
      if (!res.ok) { continue; }
      const buf = await res.arrayBuffer();
      if (buf.byteLength < 10000) { continue; }
      const base64 = Buffer.from(buf).toString('base64');
      const ct = res.headers.get('content-type') || 'image/jpeg';
      return `data:${ct};base64,${base64}`;
    } catch {
      if (attempt < retries) await new Promise(r => setTimeout(r, 2000 * attempt));
    }
  }
  return null;
}

/** hex → 어둡게 */
function darken(hex, amount) {
  const n = hex.replace('#', '');
  const r = Math.max(0, parseInt(n.slice(0, 2), 16) * (1 - amount));
  const g = Math.max(0, parseInt(n.slice(2, 4), 16) * (1 - amount));
  const b = Math.max(0, parseInt(n.slice(4, 6), 16) * (1 - amount));
  return `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`;
}

/** 슬라이드 1: 표지 */
function slide1Html(topic, imageDataUri) {
  const bg = imageDataUri
    ? `url('${imageDataUri}')`
    : `linear-gradient(160deg, ${topic.accent} 0%, ${darken(topic.accent, 0.5)} 100%)`;
  const titleHtml = topic.slide1.title.replace(/\n/g, '<br>');
  return baseHtml(topic, bg, `
    <span class="theme">${topic.themeLabel}</span>
    <div class="theme-line"></div>
    <h1 class="cover-title">${titleHtml}</h1>
    <div class="footer">
      <span class="brand">Silvertape</span>
      <span class="number">${topic.id} / 30</span>
    </div>
  `);
}

/** 슬라이드 2: 본문 전반 */
function slide2Html(topic, imageDataUri) {
  const bg = imageDataUri
    ? `url('${imageDataUri}')`
    : `linear-gradient(160deg, ${topic.accent} 0%, ${darken(topic.accent, 0.5)} 100%)`;
  const linesHtml = topic.slide2.lines.map(l => l === '' ? '<div class="spacer"></div>' : `<p>${l}</p>`).join('\n');
  return baseHtml(topic, bg, `
    <span class="theme">${topic.themeLabel}</span>
    <div class="theme-line"></div>
    <h2 class="sub-heading">${topic.slide2.heading}</h2>
    <div class="body-lines">${linesHtml}</div>
    <div class="footer">
      <span class="brand">Silvertape</span>
      <span class="number">${topic.id}-2 / 30</span>
    </div>
  `);
}

/** 슬라이드 3: 본문 후반 */
function slide3Html(topic, imageDataUri) {
  const bg = imageDataUri
    ? `url('${imageDataUri}')`
    : `linear-gradient(160deg, ${topic.accent} 0%, ${darken(topic.accent, 0.5)} 100%)`;
  const linesHtml = topic.slide3.lines.map(l => l === '' ? '<div class="spacer"></div>' : `<p>${l}</p>`).join('\n');
  return baseHtml(topic, bg, `
    <span class="theme">${topic.themeLabel}</span>
    <div class="theme-line"></div>
    <h2 class="sub-heading">${topic.slide3.heading.replace(/\n/g, '<br>')}</h2>
    <div class="body-lines">${linesHtml}</div>
    <div class="footer">
      <span class="brand">Silvertape</span>
      <span class="number">${topic.id}-3 / 30</span>
    </div>
  `);
}

/** 공통 HTML 래퍼 */
function baseHtml(topic, bgImage, content) {
  return `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<style>
  @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;700;800;900&family=Outfit:wght@600;700;800;900&display=swap');

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

  .card-bg {
    position: absolute;
    inset: 0;
    background-image: ${bgImage};
    background-size: cover;
    background-position: center;
    background-color: ${topic.accent};
  }

  .card-overlay {
    position: absolute;
    inset: 0;
    background: linear-gradient(
      180deg,
      rgba(0,0,0,0.45) 0%,
      rgba(0,0,0,0.50) 30%,
      rgba(0,0,0,0.70) 100%
    );
  }

  .card-content {
    position: relative;
    z-index: 2;
    flex: 1;
    padding: 80px 72px 72px;
    display: flex;
    flex-direction: column;
  }

  .theme {
    font-family: 'Outfit', 'Noto Sans KR', sans-serif;
    font-size: 22px;
    font-weight: 800;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: #fff;
    opacity: 0.9;
    margin-bottom: 14px;
  }

  .theme-line {
    width: 48px;
    height: 4px;
    background: rgba(255,255,255,0.7);
    margin-bottom: 48px;
    border-radius: 2px;
  }

  /* 표지 큰 제목 */
  .cover-title {
    font-family: 'Noto Sans KR', sans-serif;
    font-size: 72px;
    font-weight: 900;
    line-height: 1.22;
    color: #fff;
    text-shadow:
      0 3px 6px rgba(0,0,0,0.7),
      0 6px 24px rgba(0,0,0,0.4);
    letter-spacing: -0.02em;
    flex: 1;
    display: flex;
    align-items: center;
  }

  /* 본문 소제목 */
  .sub-heading {
    font-family: 'Noto Sans KR', sans-serif;
    font-size: 46px;
    font-weight: 900;
    line-height: 1.28;
    margin-bottom: 44px;
    color: #fff;
    text-shadow:
      0 2px 5px rgba(0,0,0,0.7),
      0 4px 16px rgba(0,0,0,0.4);
    letter-spacing: -0.01em;
  }

  /* 본문 텍스트 */
  .body-lines {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 8px;
    font-size: 30px;
    line-height: 1.65;
    font-weight: 700;
    color: #fff;
    text-shadow:
      0 1px 3px rgba(0,0,0,0.8),
      0 2px 12px rgba(0,0,0,0.3);
  }
  .body-lines p { margin: 0; }
  .body-lines .spacer { height: 16px; }

  .footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: auto;
    padding-top: 32px;
    border-top: 1px solid rgba(255,255,255,0.15);
  }

  .brand {
    font-family: 'Outfit', sans-serif;
    font-size: 20px;
    font-weight: 800;
    letter-spacing: 0.35em;
    text-transform: uppercase;
    color: #fff;
    opacity: 0.6;
  }

  .number {
    font-family: 'Outfit', sans-serif;
    font-size: 18px;
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
      ${content}
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

  console.log(`\n카드뉴스 ${TOPICS.length}토픽 × 3장 = ${TOPICS.length * 3}장 생성 시작...`);
  console.log(`출력: ${OUT_DIR}\n`);

  // 1단계: 사진 사전 다운로드 (하나씩 순차)
  console.log('사진 다운로드 중 (30장)...');
  const imageMap = new Map();
  for (const topic of TOPICS) {
    const url = `https://picsum.photos/id/${topic.photoId}/${WIDTH}/${HEIGHT}`;
    const dataUri = await downloadAsBase64(url);
    if (dataUri) {
      imageMap.set(topic.id, dataUri);
      process.stdout.write(`✓`);
    } else {
      process.stdout.write(`✗`);
    }
  }
  console.log(`\n사진 ${imageMap.size}/${TOPICS.length}장 다운로드 완료\n`);

  const browser = await puppeteer.default.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: WIDTH, height: HEIGHT, deviceScaleFactor: 1 });

  let success = 0;
  const total = TOPICS.length * 3;

  for (const topic of TOPICS) {
    const img = imageMap.get(topic.id) || null;
    const slides = [
      { html: slide1Html(topic, img), suffix: '1' },
      { html: slide2Html(topic, img), suffix: '2' },
      { html: slide3Html(topic, img), suffix: '3' },
    ];

    for (const slide of slides) {
      try {
        await page.setContent(slide.html, { waitUntil: 'domcontentloaded', timeout: 15000 });

        // 폰트 로딩 대기 (최대 5초)
        await Promise.race([
          page.evaluate(() => document.fonts.ready),
          new Promise(r => setTimeout(r, 5000)),
        ]);
        await new Promise(r => setTimeout(r, 300));

        const fileName = `card-${String(topic.id).padStart(2, '0')}-${slide.suffix}.png`;
        const filePath = join(OUT_DIR, fileName);

        const cardEl = await page.$('[data-card]');
        if (cardEl) {
          await cardEl.screenshot({ path: filePath });
        } else {
          await page.screenshot({ path: filePath, clip: { x: 0, y: 0, width: WIDTH, height: HEIGHT } });
        }

        success++;
        if (slide.suffix === '1') {
          console.log(`  ✓ ${fileName}  (${topic.themeLabel}: ${topic.slide1.title.split('\n')[0]})`);
        }
      } catch (err) {
        console.error(`  ✗ card-${String(topic.id).padStart(2, '0')}-${slide.suffix}.png  ERROR: ${err.message}`);
      }
    }
  }

  await browser.close();
  console.log(`\n완료! ${success}/${total}장 생성됨 → ${OUT_DIR}\n`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
