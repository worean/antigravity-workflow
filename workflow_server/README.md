# 🖥️ AntiGravity Workflow Server (`workflow_server`)

Node.js + Express + TypeScript + Prisma ORM 기반의 이슈 및 일감 관리 시스템 REST API 백엔드입니다.

---

## 🏗️ 3-Tier Layered Modular Architecture

본 프로젝트는 높은 유지보수성과 확장성을 위해 **3계층 모듈형 아키텍처**를 엄격히 준수합니다.

```
src/modules/{domain}/
├── {domain}.routes.ts          # [Layer 1] HTTP 라우팅 매핑 및 미들웨어 바인딩
├── {domain}.controller.ts      # [Layer 2] HTTP 요청/응답 파싱, Validation 및 에러 캐치
└── services/                   # [Layer 3] Use-Case 단위 서브 서비스
    ├── create{Domain}.service.ts
    ├── get{Domain}.service.ts
    └── ...
```

- **Routes**: Express `Router` 등록 및 미들웨어 연결
- **Controllers**: Express `req`, `res` 처리 및 응답 반환 (비즈니스 로직 작성 금지)
- **Sub-Services**: 단일 비즈니스 유스케이스 담당 (파일당 30~50줄). Express 객체 의존성 없음. Pure Business Logic & Prisma DB Access.

---

## 🔒 보안 및 인증 지침 (Security & Authentication)

- **JWT Access Token**: 모든 사용자 식별은 `req.headers.authorization`에 포함된 JWT 토큰(`jwt.verify`) 검증 결과로만 승인합니다. `req.body.userId` 등 클라이언트가 전달하는 임의의 인가 데이터에 의존하지 않습니다.
- **Subpath Import (Path Alias)**: 상대 경로 대신 `#lib/prisma.js` 등의 Subpath Imports 방식을 활용합니다.

---

## 📡 주요 REST API 엔드포인트 (API Modules)

| 모듈 경로 | 설명 | 주요 기능 |
|---|---|---|
| `/api/auth` | 인증 & 소셜 로그인 | 토큰 발급, 구글 OAuth 로그인 |
| `/api/users` | 사용자 관리 | 유저 프로필, 푸시 토큰 관리 |
| `/api/workspaces` | 워크스페이스 관리 | 기본 워크스페이스 조회/수정 (심볼, 이름), 다중 워크스페이스 관리 |
| `/api/projects` | 프로젝트 관리 | 프로젝트 생성, 가시성(Public/Protected/Private), 멤버 관리 |
| `/api/issues` | 이슈 & Task 관리 | 이슈 CRUD, 상태/우선순위 관리 |
| `/api/sprints` | 스프린트 관리 | 애자일 스프린트 생성 및 제어 |
| `/api/comments` | 댓글 & 리액션 | 댓글 작성, 멘션(@), 리액션 |
| `/api/worklogs` | 작업 시간 기록 | 작업 경과시간(Worklog) 등록/조회 |
| `/api/custom-fields` | 커스텀 필드 | 사용자 정의 동적 메타데이터 필드 |
| `/api/attachments` | 첨부파일 | 파일 업로드 및 첨부 연동 |
| `/api/link-previews` | 링크 미리보기 | URL 오픈그래프/메타데이터 미리보기 |

---

## 🌐 환경 변수 설정 가이드 (Environment Variables)

서버 실행 전 `workflow_server/` 루트 디렉토리에 `.env` 파일을 생성하거나 `.env.example`을 복사하여 환경에 맞게 값을 설정합니다.

```bash
# Windows PowerShell
Copy-Item .env.example .env

# Bash / Linux / macOS
cp .env.example .env
```

### 📋 환경 변수 상세 명세표

| 분류 | 변수명 | 필수 여부 | 기본값 (Default) | 설명 |
|---|---|:---:|---|---|
| **서버 & 네트워크** | `PORT` | 선택 | `4000` | Express REST API 서버가 바인딩할 포트 번호 |
| | `USE_HTTPS` / `ENABLE_HTTPS` | 선택 | `false` | `true` 설정 시 HTTPS(SSL/TLS) 프로토콜로 구동 (`certs/` 경로 인증서 참조) |
| | `CLIENT_BASE_URL` | 선택 | `http://localhost:5173` | 프론트엔드 클라이언트 주소 (CORS 인가 및 이메일 인증/매직 링크 생성 시 사용) |
| | `NODE_ENV` | 선택 | `development` | 런타임 환경 플래그 (`development`, `production`, `test`) |
| **데이터베이스** | `GLOBAL_DATABASE_URL` | **필수** | - | 시스템 공통 PostgreSQL DB 연결 URL (계정, 워크스페이스 메타데이터 관리) |
| | `WORKSPACE_DATABASE_URL` | **필수** | - | 워크스페이스 전용 PostgreSQL DB 연결 URL (프로젝트, 이슈, 스프린트 등 업무 데이터) |
| | `TASK_STORAGE_MODE` | 선택 | `postgresql` | 태스크 스토리지 모드 (`postgresql` 또는 `sqlite`) |
| | `DATABASE_URL` | 선택 | `WORKSPACE_DATABASE_URL` | 단일 DB 환경 또는 단위 테스트(`vitest`) 실행 시 사용되는 Fallback DB URL |
| **워크스페이스** | `DEFAULT_WORKSPACE_NAME` | 선택 | `AntiGravity` | 서버 최초 구동 시 자동 생성 및 동기화할 기본 워크스페이스의 명칭 |
| **보안 & 인증** | `JWT_SECRET` | 권장 | `antigravity-jwt-secret-key-2026` | JWT Access Token 서명 및 검증용 시크릿 키 (*운영 환경에서는 필수 지정*) |
| **소셜 로그인** | `GOOGLE_CLIENT_ID` | 선택 | - | Google Cloud Console에서 발급받은 OAuth 2.0 Web Client ID |
| | `GOOGLE_CLIENT_SECRET` | 선택 | - | Google OAuth 2.0 Client Secret 키 |
| | `GOOGLE_REDIRECT_URI` | 선택 | `http://localhost:4000/api/auth/google/callback` | Google 로그인 인증 완료 후 리디렉션될 백엔드 콜백 엔드포인트 |
| **메일 발송** | `SMTP_HOST` | 선택 | - | 이메일 인증 및 비밀번호 재설정 메일 발송용 SMTP 호스트 (예: `smtp.gmail.com`) |
| | `SMTP_PORT` | 선택 | `587` | SMTP 포트 번호 (`587` 또는 `465`) |
| | `SMTP_USER` | 선택 | - | SMTP 인증 계정 (이메일 주소) |
| | `SMTP_PASS` | 선택 | - | SMTP 인증 비밀번호 또는 앱 비밀번호 |
| | `SMTP_FROM` | 선택 | `"AntiGravity Workflow" <noreply@antigravity.internal>` | 발송 메일의 보낸 사람(From) 헤더 |

> [!NOTE]
> `SMTP_*` 변수가 설정되지 않은 경우, 개발 환경에서는 이메일 발송 대신 터미널 콘솔 로그(STDOUT)로 인증 토큰 및 링크가 출력되어 원활한 로컬 테스트가 가능합니다.

---

### 📄 `.env.example` 템플릿

```env
# ==============================================================================
# AntiGravity Workflow Server Environment Variables (.env.example)
# ==============================================================================

# 1. 서버 & 네트워크
PORT=4000
USE_HTTPS=true
ENABLE_HTTPS=true
CLIENT_BASE_URL=http://localhost:5173
NODE_ENV=development

# 2. 데이터베이스 (이원화 PostgreSQL 아키텍처)
GLOBAL_DATABASE_URL=postgresql://juyeong:qkrwndud@localhost:5432/global?schema=public
WORKSPACE_DATABASE_URL=postgresql://juyeong:qkrwndud@localhost:5432/workspace?schema=public
TASK_STORAGE_MODE=postgresql
DATABASE_URL=postgresql://juyeong:qkrwndud@localhost:5432/workspace?schema=public

# 3. 워크스페이스 기본 설정
DEFAULT_WORKSPACE_NAME=AntiGravity

# 4. 보안 및 인증 (JWT)
JWT_SECRET=antigravity-jwt-secret-key-2026

# 5. 소셜 로그인 (Google OAuth 2.0 - 선택 사항)
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=http://localhost:4000/api/auth/google/callback

# 6. 메일 발송 서비스 (SMTP - 선택 사항)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM="AntiGravity Workflow" <noreply@antigravity.internal>
```

---

## ⚙️ 실행 방법 (Running the Server)

```bash
# 1. 패키지 설치
npm install

# 2. 환경 변수 파일 생성
cp .env.example .env

# 3. Prisma 클라이언트 생성 (Global + Workspace)
npm run prisma:generate

# 4. DB 스키마 푸시 (최초 구성 시)
npm run prisma:push:global
npm run prisma:push:workspace

# 5. 개발 라이브 서버 실행
npm run dev

# 6. 프로덕션 빌드 & 실행
npm run build
npm run start
```

---

## 🧪 테스트 실행 (Vitest)

```bash
# 서브 서비스 단위 테스트 전체 실행
npm test
```

---

## 📝 파일 인코딩 지침
- 모든 소스 코드 및 Markdown 문서는 **`UTF-8 with BOM` (`utf-8-sig`)** 인코딩으로 작성하고 저장합니다.
