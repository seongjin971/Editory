# Editory

AI Story Structure Analyzer + Writing Workspace MVP입니다. 원고를 저장하고 로컬 Mock analyzer 또는 OpenAI 기반 LLM analyzer로 스토리라인, 타임라인, 등장인물, 사건 비중, 설정 충돌 후보를 생성합니다. 기본 설정은 외부 API 키 없이 실행되는 Mock analyzer입니다.

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
STORY_ANALYZER_PROVIDER="mock"
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
- `LlmStoryAnalyzer`로 OpenAI Responses API 구조화 출력 연동 가능
- 쓰기 우선 워크스페이스(`/projects/[projectId]/write`)
- `.docx` Word 문서 가져오기 후 리치 텍스트 에디터에서 이어 쓰기

## OpenAI analyzer 사용하기

분석기는 `src/lib/analysis/story-analyzer.ts`의 `StoryAnalyzer` 인터페이스를 따릅니다.

실제 OpenAI 분석을 쓰려면 `.env`에 아래 값을 추가합니다. `.env`는 GitHub에 올리지 않습니다.

```bash
STORY_ANALYZER_PROVIDER="openai"
STORY_ANALYZER_LLM_SCOPE="chapter"
OPENAI_API_KEY="sk-..."
OPENAI_MODEL="gpt-5-mini"
OPENAI_ANALYSIS_MAX_CHARS="18000"
OPENAI_SMOKE_MAX_CHARS="6000"
```

- `STORY_ANALYZER_PROVIDER="mock"`이면 항상 로컬 Mock 분석기를 사용합니다.
- `STORY_ANALYZER_PROVIDER="openai"`이고 `OPENAI_API_KEY`가 있으면 LLM 분석기를 사용합니다.
- 기본 `STORY_ANALYZER_LLM_SCOPE="chapter"`는 현재 챕터 분석만 OpenAI로 실행합니다. 전체 프로젝트 분석까지 OpenAI로 보내려면 `all`로 바꿉니다.
- OpenAI 호출 실패, 키 누락, 응답 검증 실패 시 기존 Mock analyzer로 자동 fallback됩니다.
- provider 응답은 `StoryAnalysisSchema.parse(...)`로 검증한 뒤 `src/lib/data.ts`의 `saveAnalysisResult()`가 그대로 저장합니다.
- 분석 리포트 상단에는 `OpenAI 분석` 또는 `Mock 분석` 배지가 표시됩니다. 오래된 결과는 저장 당시 metadata가 없을 수 있어 환경 설정을 바탕으로 추정 표시됩니다.

API 키가 실제로 동작하는지 확인하려면 앱 버튼을 누르기 전에 스모크 테스트를 먼저 실행합니다. 이 테스트는 fallback 없이 OpenAI만 호출하고, 결과 개수만 출력합니다.

```bash
npm run analysis:test-openai
npm run analysis:test-openai -- <projectId>
npm run analysis:test-openai -- <projectId> <manuscriptId>
```

### API 비용 주의

- 비용이 발생하는 동작: 앱의 `스토리 분석하기` / `현재 챕터 분석` / `전체 프로젝트 분석` 버튼, `npm run analysis:test-openai`.
- 비용이 발생하지 않는 동작: 원고 작성, 저장, Word 가져오기, 다크모드, 분할 창 조절, 음성 입력/읽어주기, Mock 분석 모드.
- `$5` 같은 작은 한도로 테스트할 때는 `STORY_ANALYZER_LLM_SCOPE="chapter"`를 유지하고, 전체 프로젝트 분석은 필요할 때만 실행하세요.
- 앱 분석 버튼에는 실행 전 확인창이 표시됩니다.

## Cafe24 테스트 배포

Cafe24 서버에 올려 테스터 링크를 만들 때는 [DEPLOY_CAFE24.md](./DEPLOY_CAFE24.md)를 참고하세요. 운영 서버에서는 `.env`와 `prisma/prod.db`를 GitHub에 올리지 않습니다.

## 테스터 QA 체크리스트

친구/작가 테스터에게 기능을 맡길 때는 [TESTER_QA.md](./TESTER_QA.md)를 같이 전달하면 됩니다.
