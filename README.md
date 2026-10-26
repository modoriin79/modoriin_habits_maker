# Little Ritual · 작은 실천을 모으는 곳

하루의 습관을 유리 구슬로 기록하는 개인용 웹앱입니다. Three.js로 병과 구슬을 생성하고 cannon-es로 구슬의 낙하·충돌·굴러가는 움직임을 계산합니다. 외부 이미지, API 키, 서버, 계정 없이 동작합니다.

## 개발

Node.js 24와 npm을 사용합니다.

```sh
npm ci
npm run dev
```

개발 서버는 기본 5173 포트를 사용합니다. 클라우드 개발 서버 주소가 인터넷에 자동 공개되는 것은 아닙니다.

```sh
npm test          # 기록 규칙, 저장, 30개 물리 충돌 검증
npm run test:e2e # 실제 Chromium 클릭·터치·완료·복원 검증
npm run build    # dist/ 정적 배포 파일
npm run preview # 빌드된 앱 확인
```

브라우저 테스트는 `CHROMIUM_PATH` 환경 변수 또는 `/usr/bin/chromium`을 사용합니다. 해당 브라우저가 없다면 `npx playwright install chromium`으로 설치한 뒤 설정의 executablePath를 제거하거나 설치된 실행 파일 경로를 지정하세요. 날짜를 기다릴 필요 없이 테스트 안에서 1개·29개·30개 상태를 준비하며, 일반 앱에는 테스트 조작을 노출하지 않습니다.

## 기록 방식

- 기기의 현지 날짜를 기준으로 하루 하나, 누적 30번마다 완성됩니다.
- 병은 세이지·앰버·라벤더·로즈·하늘 팔레트에서 직전과 다른 색으로 완성됩니다.
- 기록 날짜, 개별 구슬의 위치, 완성 날짜와 색상을 `localStorage`의 `little-ritual:v1`에 저장합니다.
- 오늘 기록 취소는 30번째 구슬의 완성도 되돌립니다.
- 같은 브라우저의 탭 간에는 Web Locks를 지원하는 브라우저에서 기록을 직렬화합니다.
- 상단 `?` 메뉴에서 JSON 백업·복원이 가능합니다. 데이터는 기기·브라우저·사이트 주소별로 분리됩니다. 다른 기기 동기화는 없습니다. 주소를 변경하기 전에 백업하고 새 주소에서 복원하세요.
- 하드웨어 가속과 WebGL2가 필요합니다. 기기 픽셀 비율은 1.6으로 제한하고, 평상시에는 연속 렌더링하지 않습니다. 쌓인 구슬은 정지된 충돌체로 유지하여 움직이는 구슬 한 개만 계산합니다.

## GitHub Pages로 사용하기

이 저장소의 `docs/`에는 바로 게시할 수 있는 앱이 들어 있습니다. 별도 서버, 결제, API 키가 필요하지 않습니다.

1. GitHub에서 `modoriin79/modoriin_habits_maker` 저장소를 엽니다.
2. **Settings → Pages**로 이동합니다.
3. **Build and deployment → Source**를 **Deploy from a branch**로 선택합니다.
4. **Branch**는 **main**, 폴더는 **/docs**로 선택하고 **Save**를 누릅니다.
5. GitHub의 배포가 끝나면 같은 화면의 **Visit site**로 접속합니다. 예상 주소는 `https://modoriin79.github.io/modoriin_habits_maker/`이며, 실제 게시 성공 여부는 Pages 화면과 사이트 응답을 확인해야 합니다.

소스를 수정한 뒤에는 아래 명령으로 `docs/`도 함께 갱신하고 소스와 생성 파일을 커밋·푸시하세요. GitHub Pages는 main의 docs 변경을 자동 게시합니다.

```sh
npm ci
npm test
npm run build:pages
git add docs
# 소스 변경도 함께 커밋한 뒤 main 브랜치에 푸시
```

`vite.config.js`의 상대 경로 설정으로 저장소 이름이 포함된 GitHub Pages 주소에서도 JS/CSS를 읽을 수 있습니다. `docs/.nojekyll`로 정적 빌드 파일을 그대로 제공합니다. Netlify/Vercel을 사용할 경우 `npm run build`의 `dist/`를 게시할 수도 있습니다.

## 계정 없이 파일로 먼저 사용해보기

`npm run build` 후 `node scripts/package-preview.mjs`를 실행하면 `/workspace/artifacts/little-ritual.html` 단일 파일이 만들어집니다. 다운로드 후 Chrome 또는 Edge에서 열어 사용하세요. 이 클라우드의 관리형 Chromium은 file:// 접근을 차단하므로, 여기서는 단일 파일을 내부 HTTP로 제공해 실행을 검증했습니다. 이는 공개 웹 주소가 아닌 파일 미리보기이며, 파일 주소의 저장 동작은 브라우저에 따라 다를 수 있으므로 지속 사용에는 HTTPS 배포를 권장합니다.

## 검증 범위

자동 테스트는 저장/취소/완성 규칙과 물리적 겹침·내부 경계, 실제 데스크톱 및 모바일 브라우저 조작을 검증합니다. 프로덕션 빌드 및 단일 파일의 HTTP 실행도 별도 확인했습니다. 외부 공개 URL 및 새 클라우드 작업에서의 복원은 배포/게시 후 별도로 확인해야 합니다.
