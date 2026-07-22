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
| `/api/projects` | 프로젝트 관리 | 프로젝트 생성, 멤버 관리 |
| `/api/issues` | 이슈 & Task 관리 | 이슈 CRUD, 상태/우선순위 관리 |
| `/api/sprints` | 스프린트 관리 | 애자일 스프린트 생성 및 제어 |
| `/api/comments` | 댓글 & 리액션 | 댓글 작성, 멘션(@), 리액션 |
| `/api/worklogs` | 작업 시간 기록 | 작업 경과시간(Worklog) 등록/조회 |
| `/api/custom-fields` | 커스텀 필드 | 사용자 정의 동적 메타데이터 필드 |
| `/api/attachments` | 첨부파일 | 파일 업로드 및 첨부 연동 |
| `/api/link-previews` | 링크 미리보기 | URL 오픈그래프/메타데이터 미리보기 |

---

## ⚙️ 실행 방법 (Running the Server)

```bash
# 패키지 설치
npm install

# Prisma 클라이언트 생성
npx prisma generate

# 개발 라이브 서버 실행
npm run dev

# 프로덕션 빌드 & 실행
npm run build
npm run start
```

---

## 📝 파일 인코딩 지침
- 모든 소스 코드 및 Markdown 문서는 **`UTF-8 with BOM` (`utf-8-sig`)** 인코딩으로 작성하고 저장합니다.
