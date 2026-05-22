# 스토리랩

AI Story Structure Analyzer + Writing Workspace MVP입니다. 원고를 저장하고 로컬 Mock analyzer로 스토리라인, 타임라인, 등장인물, 사건 비중, 설정 충돌 후보를 생성합니다. 외부 API 키는 필요하지 않습니다.

## 실행

```bash
npm install
npx prisma migrate dev
npx prisma db seed
npm run dev
```

브라우저에서 `http://localhost:3000`을 엽니다. 기존 프로젝트가 있으면 바로 쓰기 화면으로 이동하고, 프로젝트 목록은 `/dashboard`에서 볼 수 있습니다.

## 로컬 로그인

공개 회원가입은 없습니다. `npx prisma db seed`를 실행하면 tester 계정 1개가 생성됩니다.

- 기본 이메일: `test@test.com`
- 기본 비밀번호: `102800`

`.env`에는 최소한 아래 값이 필요합니다. 실제 `.env`는 GitHub에 올리지 않습니다.

```bash
DATABASE_URL="file:./dev.db"
SESSION_SECRET="replace-with-a-random-32-byte-secret"
TESTER_EMAIL="test@test.com"
TESTER_PASSWORD="102800"
```

tester 비밀번호를 재설정하려면 로컬 관리자 터미널에서 실행합니다.

```bash
npm run auth:reset-tester -- new-password
```

## 구성

- Next.js App Router, TypeScript, React, Tailwind CSS
- Prisma ORM + SQLite
- Zod 기반 `StoryAnalysisSchema`
- `MockStoryAnalyzer`로 deterministic 구조 분석
- `LlmStoryAnalyzer` placeholder 포함
- 쓰기 우선 워크스페이스(`/projects/[projectId]/write`)

## LLM analyzer로 교체하기

분석기는 `src/lib/analysis/story-analyzer.ts`의 `StoryAnalyzer` 인터페이스를 따릅니다.

1. `src/lib/analysis/llm-story-analyzer.ts`에서 실제 provider 호출을 구현합니다.
2. provider 응답 JSON을 `StoryAnalysisSchema.parse(...)`로 검증합니다.
3. `src/lib/analysis/index.ts`의 `getStoryAnalyzer()`가 `new LlmStoryAnalyzer()`를 반환하도록 바꿉니다.
4. 저장 로직은 `src/lib/data.ts`의 `saveAnalysisResult()`가 그대로 처리합니다.

현재 MVP는 `MockStoryAnalyzer`를 사용하므로 로컬에서 바로 실행됩니다.
