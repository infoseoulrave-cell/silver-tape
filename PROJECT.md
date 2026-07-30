# 프로젝트 정체성 (Project Identity)

**이 저장소 = Silvertape 프로젝트**

- **서비스명:** Silvertape
- **도메인:** https://silvertape.art
- **GitHub:** https://github.com/infoseoulrave-cell/silver-tape (Vercel 연동됨)
- **배포:** Vercel (info.seoulrave@gmail.com 계정)
- **이메일:** hello@silvertape.art

폴더명이 `hangover-web`인 것은 과거 레거시입니다.  
**다른 프로젝트(예: hangover 단독 프로젝트)와 혼동하지 말 것.**

- **HANGOVER** = 이 사이트(silvertape.art) 안에 있는 **스튜디오/브랜드 하나**일 뿐입니다.
- 스튜디오 목록: HANGOVER, VOID, SENSIBILITY STAIR 등 (`src/data/studios.ts`).

AI/에이전트 사용 시 이 프로젝트를 "silvertape" 또는 "silvertape.art"로 인식하고,  
다른 hangover 관련 프로젝트와 섞지 말 것.

## 프로젝트 상황분석 (2026-03-01)

- `hangover-web`는 레거시 폴더/패키지명이고, 실제 서비스는 **Silvertape**입니다.
- 현재 저장소는 **Next.js 16 + React 19 + TypeScript** 기반 단일 웹앱 구조입니다.
- 실행 스크립트는 `dev`, `build`, `start`만 정의되어 있고 별도 lint/test 스크립트는 없습니다.
- 의존성 설치 후 `npm run build` 기준, 샌드박스 네트워크 제약으로 Google Fonts fetch 실패가 확인됩니다.
  - `src/app/layout.tsx`의 `next/font/google` 로드 단계에서 `Playfair Display`, `Space Grotesk` 요청이 실패합니다.
- 위 실패는 런타임 로직보다는 외부 폰트 네트워크 접근성에 의존하는 빌드 환경 이슈로 분류됩니다.
