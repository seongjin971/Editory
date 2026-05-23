# Editory Cafe24 배포 메모

Editory는 Next.js 서버 앱입니다. 정적 HTML만 올리는 일반 웹호스팅/FTP 배포로는 실행할 수 없고, Node.js 앱을 실행할 수 있는 Cafe24 Node.js 호스팅 또는 VPS가 필요합니다.

## 권장 선택

- 가장 안정적인 선택: Cafe24 개발언어 VPS 또는 일반 VPS
- 가능하지만 제약이 있는 선택: Cafe24 Node.js 호스팅
- 부적합: PHP/Apache 중심 일반 웹호스팅

Cafe24 안내 기준으로 Node.js 호스팅은 Git으로 소스를 올리며, Node.js 호스팅 자체는 SSL 인증서 설치를 지원하지 않습니다. 테스터에게 HTTPS 링크를 주고 싶다면 VPS에서 nginx + SSL 구성이 더 안전합니다.

## 서버 요구사항

- Node.js 20.9 이상
- npm
- Git
- SQLite 파일을 저장할 수 있는 영구 디스크
- 앱 실행 포트 1개

## 최초 배포

서버에서:

```bash
git clone https://github.com/seongjin971/Editory.git
cd Editory
cp .env.production.example .env
nano .env
```

`.env`에서 반드시 바꿉니다.

```bash
DATABASE_URL="file:./prod.db"
SESSION_SECRET="32자 이상 랜덤 문자열"
TESTER_EMAIL="test@test.com"
TESTER_PASSWORD="테스터에게 줄 비밀번호"
NODE_ENV="production"
PORT="3000"
NEXT_PUBLIC_BASE_PATH=""
NEXT_PUBLIC_SITE_URL="http://서버주소"
SESSION_COOKIE_SECURE="false"
```

초기 설치/마이그레이션/테스터 생성/빌드:

```bash
npm run deploy:init
```

실행:

```bash
npm run start
```

PM2를 쓸 수 있는 서버라면:

```bash
npm install -g pm2
pm2 start ecosystem.config.cjs
pm2 save
```

## 업데이트 배포

운영 데이터가 있는 서버에서는 `npx prisma db seed`를 반복 실행하지 않습니다. 개발용 seed는 샘플 데이터를 다시 만들 수 있습니다.

```bash
git pull
npm run deploy:update
pm2 restart editory
```

PM2를 쓰지 않는다면 실행 중인 Node 프로세스를 중지한 뒤 `npm run start`를 다시 실행합니다.

## 테스터 계정 재설정

`.env`의 `TESTER_PASSWORD`를 새 값으로 바꾼 뒤:

```bash
npm run auth:ensure-tester
pm2 restart editory
```

또는 임시로 한 번만 바꾸려면:

```bash
npm run auth:reset-tester -- 새비밀번호
```

## 테스터에게 전달할 것

- 접속 링크: `http://서버주소:포트` 또는 도메인
- 이메일: `.env`의 `TESTER_EMAIL`
- 비밀번호: `.env`의 `TESTER_PASSWORD`

## 기존 도메인 아래 경로로 붙일 때

이미 같은 서버의 80번 포트에 다른 서비스가 있다면 Editory를 `/editory` 같은 하위 경로로 붙일 수 있습니다. 이때 `.env`에 아래 값을 추가한 뒤 다시 빌드합니다.

```bash
NEXT_PUBLIC_BASE_PATH="/editory"
npm run build
pm2 restart editory --update-env
```

Apache를 쓰는 경우 기존 `/` 프록시보다 위에 아래 규칙을 둡니다.

```apache
ProxyPass /editory http://127.0.0.1:3200/editory
ProxyPassReverse /editory http://127.0.0.1:3200/editory
ProxyPass /editory/ http://127.0.0.1:3200/editory/
ProxyPassReverse /editory/ http://127.0.0.1:3200/editory/
```

## 주의

- `.env`와 `prisma/prod.db`는 GitHub에 올리지 않습니다.
- SQLite는 MVP 테스트용으로 충분하지만, 동시에 여러 사용자가 장시간 쓰는 운영 서비스로 커지면 PostgreSQL 전환을 권장합니다.
- Word 업로드를 쓰므로 서버 액션 업로드 한도는 12MB로 설정되어 있습니다.
- 현재처럼 HTTP로 테스트할 때는 `SESSION_COOKIE_SECURE="false"`로 둡니다. HTTPS를 붙인 뒤에는 `NEXT_PUBLIC_SITE_URL`을 `https://...`로 바꾸고 `SESSION_COOKIE_SECURE="true"`로 전환합니다.
