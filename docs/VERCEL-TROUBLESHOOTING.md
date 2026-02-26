# Vercel 트러블슈팅 참고 (Silvertape)

에러 메시지나 상황별로 아래에서 해당 항목을 찾아보세요.

---

## Domain verification through CLI

도메인 소유 확인: Vercel 네임서버 또는 DNS 레코드로 도메인을 Vercel에 연결해야 함.

- **확인:** `vercel domains inspect <domain>` (예: `vercel domains inspect silvertape.art`)
- 이미 프로젝트에 도메인을 추가했다면: [Custom Domain 문서](https://vercel.com/docs/concepts/projects/domains)의 "Configuring a domain" 참고

---

## Leaving the team

- 팀에 **Owner가 본인 혼자**이거나 **확인된 멤버가 본인 혼자**면 퇴장 불가.
- 퇴장하려면: 다른 확인된 멤버를 Team Owner로 지정한 뒤 퇴장.
- 멤버가 본인만 있으면: 팀을 삭제해야 함.

---

## Git default ignore list

- **Vercel CLI**로 만든 배포: 보안/성능상 일부 파일이 자동 무시됨.
- **Git 연동** 배포: `.gitignore` 기준이라 위 파일이 커밋되어 있으면 무시되지 않고 **경고**만 출력됨.
- **의도적으로 커밋한 파일**이면 경고만 보고 넘어가도 됨.
- **실수로 커밋한 파일**이면:
  ```bash
  git rm file.txt
  echo 'file.txt' >> .gitignore
  git add .gitignore
  git commit -m "Removed file.txt"
  git push
  ```

---

## GitHub app installation not found

GitHub 로그인/연동 시 GitHub DB 불일치로 Vercel GitHub App 설치가 안 된 것처럼 보일 수 있음.

- **조치:** 몇 분 기다린 뒤 GitHub 연결 다시 시도.
- 계속 안 되면 GitHub Support에 문의.

---

## Preview branch used as production branch

도메인이나 환경 변수에 **특정 Git 브랜치**를 지정해 두면, 그 브랜치는 "preview"로 취급됨.  
그 브랜치를 **프로젝트 설정의 Production 브랜치**로 선택할 수 없음.

**해결:**  
1. 해당 도메인에서 Git 브랜치 설정 제거 → Production 환경에 할당.  
2. 해당 환경 변수에서 Git 브랜치 제거 → Production에 할당.  
3. 그 다음 원하는 브랜치를 Production 브랜치로 설정.

---

## Lost Git repository access

다음이 있으면 Vercel이 Git 저장소에 접근하지 못함:

- 저장소 삭제/아카이브
- Vercel App이 해당 Git 계정/조직에서 제거됨
- (GitHub) Vercel GitHub App의 저장소 접근 권한이 변경됨

**확인:**  
- 개인: GitHub → Applications → Installed GitHub Apps → Vercel → 접근 권한에 해당 repo 있는지 확인.  
- 조직: 조직 설정 → Installed GitHub Apps → Vercel → 동일 확인.

---

## Production deployment cannot be redeployed

이미 **그보다 최신** Production 배포가 있으면, 예전 Production 배포는 “Redeploy” 불가 (덮어쓰기 방지).

- **예전 배포를 다시 쓰고 싶다면:** 해당 배포에서 **Promote** 사용.

---

## SSL certificate deletion denied

- Hobby/팀용 **와일드카드·스테이징** 등 플랫폼이 만든 SSL은 대시보드/CLI로 **삭제 불가**.
- **Enterprise** 팀은 Custom SSL 업로드 가능하며, 그건 수동 삭제 가능.

---

## Production branch used as preview branch

- **Production 브랜치**는 프로젝트 설정의 “Production branch”로 지정한 브랜치.
- 도메인/환경 변수에 **별도 브랜치를 지정하지 않으면** 이미 Production 브랜치에 연결된 상태.
- 도메인/환경 변수에 **특정 브랜치를 넣고 싶다면**, 그 브랜치는 **preview 브랜치**여야 함 (Production 브랜치와 동일한 이름을 preview용으로 또 넣는 건 불가).

---

## Command not found in vercel dev

`vercel dev`가 실행하려는 **하위 프로그램**이 로컬에 없을 때 발생 (예: Go 함수인데 `go` 미설치).

- **조치:** 해당 런타임/CLI를 OS에 설치한 뒤 다시 `vercel dev` 실행.

---

## Recursive invocation of commands

**원인:** 프로젝트 설정에서  
- Build Command가 `vercel build` 를 호출하거나  
- Development Command가 `vercel dev` 를 호출하는 경우.  
→ 배포/로컬 실행 시 무한 재귀.

**해결:**  
- Build Command / Development Command에서 `vercel build`, `vercel dev` 제거.
- **프레임워크에서 권장하는** 빌드/개발 명령만 사용 (Override 끄면 Preset 기본값 사용).

---

## Pnpm engine unsupported

`ERR_PNPM_UNSUPPORTED_ENGINE`: `package.json#engines.pnpm`이 현재 pnpm 버전과 맞지 않음.

**해결 (둘 중 하나):**  
1. `ENABLE_EXPERIMENTAL_COREPACK=1` 설정하고, `package.json`에 `packageManager`와 `engines.pnpm` 맞게 설정.  
2. 또는 `package.json`에서 `engines.pnpm` 제거.  
- `engine-strict`로는 이 에러를 해결할 수 없음 (의존성만 검사).

---

## Yarn dynamic require of "util" is not supported

yarn + corepack + `package.json`에 `"type": "module"` 일 때 나는 알려진 yarn 이슈.

**선택지:**  
- `package.json`에서 `"type": "module"` 제거.  
- 또는 corepack 대신 프로젝트에 yarn 직접 설치: `yarn set version <version> --yarn-path`.

---

## Invalid Edge Config connection string

삭제된 Edge Config이거나, 연결 문자열의 토큰이 무효/삭제된 경우.

- **조치:** 해당 연결 문자열을 쓰는 **환경 변수**를 삭제하거나 올바른 연결 문자열로 갱신. (보통 변수명 `EDGE_CONFIG`.)

---

## Globally installed @vercel/speed-insights or @vercel/analytics

이 패키지들은 **앱의 package.json에 의존성으로 있어야** 함. 전역만 설치되어 있으면 배포 시 에러.

- **조치:** `package.json`의 `dependencies`에 `@vercel/speed-insights` / `@vercel/analytics` 추가.

---

## Oversized Incremental Static Regeneration page

ISR 응답이 **20 MB 초과**면 프로덕션에서 `FALLBACK_BODY_TOO_LARGE`로 렌더 실패. Next.js 등 빌드 타임 프리렌더링에 해당.

- **조치:** 해당 페이지가 반환하는 데이터/HTML 크기를 20 MB 이하로 줄이기 (데이터 축소, 페이지 분할 등).
