# 📋 사용자 프로필 확장 (자기소개, 부서, 직책) Feature Specification & Planning Document (기능 기획 사양서)

> **문서 상태**: Approved  
> **기능 ID**: `FEAT-USERS-01`  
> **대상 도메인**: `users`  
> **작성자 / 일자**: `Antigravity Assistant` / `2026-09-30`  
> **관련 문서**: [GEMINI.md](file:///C:/Users/admin/antigravity-workflow/GEMINI.md) (개발 표준 파이프라인 준수)

---

## 1. 기능 개요 및 사용자 가치 (Feature Overview)

### 1.1 배경 및 목적 (Background & Objective)
- **배경**: 협업 도구에서 팀원 간 원활한 커뮤니케이션과 신원 식별을 위해 이름과 이메일 외에도 담당 부서, 직책, 업무 소개(자기 설명)를 확인할 수 있어야 하나, 기존 시스템에는 해당 필드가 없어 멤버의 소속과 역할을 파악하기 어려웠습니다.
- **목적**: 사용자가 본인의 프로필에 자기 소개(`bio`), 소속 부서(`department`), 직책(`jobTitle`)을 자유롭게 등록·수정할 수 있도록 지원하고, 설정 화면뿐만 아니라 메인 내비게이션 프로필 카드 및 채팅방 멤버 사이드바 등 주요 협업 UI에 시각적으로 노출하여 협업 효율성을 극대화합니다.

### 1.2 핵심 사용자 시나리오 (User Journey & Core Value)
1. **자유로운 프로필 정보 입력 및 관리**: 사용자는 환경설정(`Settings`) > 프로필 탭에서 본인의 부서(예: '플랫폼개발팀'), 직책(예: '시니어 엔지니어'), 자기소개(예: '백엔드 아키텍처 및 분산 처리를 담당하고 있습니다.')를 입력하고 즉시 저장할 수 있습니다.
2. **협업 맥락 식별 강화**: 다른 팀원들은 좌측 하단 사용자 프로필 카드 및 채팅 채널 멤버 목록에서 상대방의 이름과 함께 부서/직책 배지를 확인하여 올바른 담당자에게 문의할 수 있습니다.

### 1.3 사용자 권한 및 접근 제어 (Authorization & Scope)
- **적용 스코프**: 전역(Core Global User) 및 워크스페이스(Workspace User) 연동
- **필요 권한**:
  - `MEMBER`: 본인의 프로필(이름, 아바타, 자기소개, 부서, 직책) 수정 권한. 타 사용자의 프로필은 조회만 가능.
  - `ADMIN`: 본인 프로필 수정 및 전체 사용자 프로필 조회/관리 권한.

---

## 2. 데이터 모델 및 비즈니스 규칙 (Data Model & Business Rules)

### 2.1 데이터베이스 스키마 요구사항 (Prisma Schema Target)
- **대상 DB**: `workflow_server/prisma/schema.global.prisma` 및 `workflow_server/prisma/schema.workspace.prisma`
- **신규 / 변경 모델 명세**:

```prisma
// Global DB (schema.global.prisma) & Workspace DB (schema.workspace.prisma)
model User {
  id           Int       @id @default(autoincrement())
  email        String    @unique
  name         String?
  password     String?
  role         String    @default("MEMBER")
  avatar       String?
  avatarColor  String?
  pushToken    String?
  preferences  String?   @default("{}")

  // 신규 추가 필드
  bio          String?   @db.Text         // 자기 설명 / 소개 (최대 500자)
  department   String?   @db.VarChar(100) // 소속 부서명 (예: 플랫폼개발팀)
  jobTitle     String?   @db.VarChar(100) // 직책 / 직급 (예: 테크리드, 시니어 엔지니어)

  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt
}
```

### 2.2 필드 상세 명세 및 제약조건 (Field Constraints)
| 필드명 | 타입 | 필수 여부 | 기본값 | 제약조건 / 유효성 검사 규칙 |
| :--- | :--- | :---: | :--- | :--- |
| `bio` | String | 선택 | `null` | 최대 500자 이하, 줄바꿈 허용 (멀티라인 텍스트) |
| `department` | String | 선택 | `null` | 최대 100자 이하, 앞뒤 공백 trim |
| `jobTitle` | String | 선택 | `null` | 최대 100자 이하, 앞뒤 공백 trim |

### 2.3 비즈니스 로직 & 엣지 케이스 (Business Logic & Edge Cases)
1. **Global DB 및 Workspace DB 동기화**: 사용자가 프로필을 수정할 때 Global DB와 현재 활성화된 테넌트 Workspace DB 양쪽의 `User` 레코드가 일관되게 갱신되어야 함.
2. **빈 문자열 처리**: 사용자가 입력값을 지우고 저장할 경우 빈 문자열(`""`)은 DB에 `null` 또는 빈 문자열로 안전하게 저장되어 기본 placeholder UI가 표시됨.
3. **타 사용자 수정 차단**: 본인(`req.user.id`) 또는 ADMIN 권한이 아닌 사용자가 다른 유저의 프로필 수정을 시도할 경우 `403 Forbidden` 차단.

---

## 3. 백엔드 REST API 명세 (Backend API Specifications)

### 3.1 엔드포인트 목록 (Endpoint Summary)
| Action | Method | URL Endpoint | 권한 | 설명 |
| :--- | :---: | :--- | :---: | :--- |
| 프로필/유저 목록 조회 | `GET` | `/api/users` | 인증 사용자 | 부서, 직책, 자기소개가 포함된 사용자 목록 조회 |
| 단일 유저 상세 조회 | `GET` | `/api/users/:id` | 인증 사용자 | 단일 사용자의 전체 프로필(bio, department, jobTitle 포함) 조회 |
| 본인 프로필 수정 | `PUT` | `/api/users/:id` | 본인 / ADMIN | 이름, 아바타, 자기소개, 부서, 직책 수정 |

### 3.2 상세 요청 및 응답 규격 (Detailed Request / Response)

#### 1) `PUT /api/users/:id` - 사용자 프로필 수정
- **Headers**: `Authorization: Bearer <token>`
- **Request Body**:
```json
{
  "name": "홍길동",
  "bio": "프론트엔드 및 풀스택 개발을 담당하고 있습니다.",
  "department": "웹플랫폼개발팀",
  "jobTitle": "시니어 소프트웨어 엔지니어"
}
```
- **Success Response (`200 OK`)**:
```json
{
  "id": 1,
  "email": "worean@naver.com",
  "name": "홍길동",
  "role": "ADMIN",
  "avatar": null,
  "avatarColor": "#38bdf8",
  "bio": "프론트엔드 및 풀스택 개발을 담당하고 있습니다.",
  "department": "웹플랫폼개발팀",
  "jobTitle": "시니어 소프트웨어 엔지니어",
  "updatedAt": "2026-09-30T17:20:00.000Z"
}
```
- **Error Codes (Negative Responses)**:
  - `400 Bad Request`: 유효성 검사 실패 (예: `bio` 길이 500자 초과)
  - `401 Unauthorized`: 토큰 누락 또는 만료
  - `403 Forbidden`: 타 사용자 프로필 수정 시도 권한 없음
  - `404 Not Found`: 대상 사용자 ID 미존재

---

## 4. 프론트엔드 UI/UX 사양 (Frontend UI/UX Specifications)

### 4.1 페이지 및 라우트 구조 (Page & Route)
- **페이지 및 설정 탭**: `src/components/settings/SettingsProfileTab.tsx`
- **프로필 노출 컴포넌트**:
  - `src/components/ProfileCard.tsx` (좌측 하단 내비게이션 바)
  - `src/components/chat/ChatMemberSidebar.tsx` (채팅방 우측 멤버 목록)

### 4.2 컴포넌트 모듈화 계획 (Sub-Component Breakdown)
> ⚠️ **원칙**: 모든 컴포넌트 파일은 **400줄 이하**로 분할하며, `src/components/settings/` 및 `src/components/chat/` 모듈러 원칙을 준수합니다.

```text
src/components/settings/
├── SettingsProfileTab.tsx       # 사용자 프로필 수정 폼 (이름, bio, department, jobTitle 입력)
src/components/
├── ProfileCard.tsx              # 좌측 하단 프로필 카드 (이름, 부서/직책 태그, 이메일)
src/components/chat/
├── ChatMemberSidebar.tsx        # 채팅방 멤버 사이드바 (이름, 부서/직책 서브텍스트)
```

### 4.3 모달 및 팝업 정책 (Modal & Overlay Policy)
- 환경설정 모달(`SettingsModal`) 내 프로필 탭에서 수정 인터랙션 제공.
- 수정 완료 시 즉시 `useAuth`의 `user` 상태 및 React Query 캐시 동기화.

### 4.4 상태 관리 분리 계획 (State Management Architecture)
1. **Auth Context (`useAuth`)**:
   - 로그인된 사용자 객체(`user`)에 `bio`, `department`, `jobTitle`을 동기화하여 전역 어디서나 참조 가능.
2. **Server State (TanStack Query v5)**:
   - 프로필 갱신 시 `queryClient.invalidateQueries({ queryKey: ['users'] })` 호출로 팀원 목록 실시간 갱신.

### 4.5 Phase 1 병렬 개발용 Mock Data 명세 (Mock Contract)

```typescript
// src/api/users.mock.ts
export const MOCK_USERS_ITEMS = [
  {
    id: 1,
    email: "worean@naver.com",
    name: "시스템 최고 관리자",
    role: "ADMIN",
    bio: "AntiGravity 워크플로우 시스템 전반의 아키텍처 및 플랫폼을 총괄합니다.",
    department: "플랫폼코어개발팀",
    jobTitle: "테크 리드 / 수석 엔지니어",
    avatar: null,
    avatarColor: "#38bdf8",
    createdAt: "2026-09-01T00:00:00.000Z"
  },
  {
    id: 43,
    email: "qkqwnjdud@gmail.com",
    name: "박주영",
    role: "MEMBER",
    bio: "사용자 중심의 직관적이고 미려한 UI/UX 구현을 전담합니다.",
    department: "프론트엔드UX팀",
    jobTitle: "선임 디자이너 & 엔지니어",
    avatar: null,
    avatarColor: "#10b981",
    createdAt: "2026-09-17T00:00:00.000Z"
  }
];
```

---

## 5. QA 및 통합 테스트 시나리오 (QA & Scenario Test Cases)

### 5.1 정상 시나리오 (Positive Test Cases)
| TC ID | 테스트 명칭 | 사전 조건 | 조작 단계 | 기대 결과 (UI 및 데이터) |
| :---: | :--- | :--- | :--- | :--- |
| `TC-POS-01` | 프로필 정보(부서/직책/자기소개) 정상 수정 | 로그인 완료 | 1. 설정 > 프로필 탭 이동<br>2. 부서, 직책, 자기소개 입력 후 '프로필 저장' 클릭 | "프로필 정보가 성공적으로 변경되었습니다." 메시지 표시 및 상태 갱신 |
| `TC-POS-02` | 좌측 ProfileCard에 부서/직책 노출 | TC-POS-01 완료 상태 | 좌측 하단 ProfileCard 확인 | 사용자 이름 옆 또는 아래에 [부서 · 직책] 배지가 정상 노출 |
| `TC-POS-03` | 채팅방 멤버 사이드바에 부서/직책 노출 | 채팅방 진입 | 우측 멤버 목록 확인 | 멤버 이름 아래에 소속 부서 및 직책 정보가 서브텍스트로 출력 |

### 5.2 예외 및 차단 시나리오 (Negative Test Cases)
| TC ID | 테스트 명칭 | 입력 및 상황 | 기대 에러 응답 | UI 처리 (Toast / 경고) |
| :---: | :--- | :--- | :--- | :--- |
| `TC-NEG-01` | 자기소개 글자 수 초과 입력 | 자기소개 501자 이상 입력 후 저장 요청 | `400 Bad Request` | "자기소개는 최대 500자까지 입력 가능합니다." 에러 안내 |
| `TC-NEG-02` | 타 사용자 프로필 무단 수정 시도 | 본인이 아닌 타 사용자 ID로 `PUT /api/users/:id` 호출 | `403 Forbidden` | "본인의 프로필만 수정할 수 있습니다." 차단 |
| `TC-NEG-03` | 비인증 상태에서 프로필 수정 요청 | JWT 토큰 없이 API 호출 | `401 Unauthorized` | "인증이 필요합니다." 응답 및 로그인 창 유도 |

### 5.3 데이터 정합성 및 회귀 검증 (Data Integrity Points)
- `bio`, `department`, `jobTitle`이 비어있는(`null` 또는 `""`) 사용자에 대해서도 UI 깨짐이나 오류 없이 유연하게 표시되는지 검증.
- Global DB와 Workspace DB 양쪽에 동일하게 반영되는지 트랜잭션 무결성 검증.

---

## 6. 개발 파이프라인 산출물 체크리스트 (Deliverables Checklist)

[GEMINI.md](file:///C:/Users/admin/antigravity-workflow/GEMINI.md)에 정의된 **Concurrent & API-Viewer Bridge Pipeline**에 따른 필수 산출물입니다.

### 🚩 Phase 1: 병렬 동시 착수 (Parallel Initiation)
- [x] **Backend (`backend-developer`)**:
  - [x] Prisma 스키마 반영 (`schema.global.prisma`, `schema.workspace.prisma`에 `bio`, `department`, `jobTitle` 필드 추가)
  - [x] API 스펙 산출물 문서 작성: `docs/api/users/update_profile.md`
  - [x] DTO 및 3-Tier 모듈 작성: `src/modules/users/*` (updateUser, getUser, getUsers 서비스)
  - [x] 단위 테스트 작성 및 통과: `src/tests/users.profile.test.ts`
- [x] **Frontend (`frontend-developer`)**:
  - [x] 컴포넌트 사양서 문서 작성: `docs/components/users_COMPONENTS.md`
  - [x] 도메인 타입 정의: `src/types/index.ts` (`User` 인터페이스에 필드 추가)
  - [x] UI 모듈러 서브 컴포넌트 구현: `SettingsProfileTab.tsx`, `ProfileCard.tsx`, `ChatMemberSidebar.tsx`
  - [x] Mock 데이터 기반 UI 및 상태 바인딩

### 🚩 Phase 2: API 완성 및 브릿지 전달 (API Bridge)
- [x] **Bridge Hub (`api-viewer`)**:
  - [x] `api_inspector.py` 실행을 통한 `docs/api/users/` 및 백엔드 실제 구현 소스 스캔
  - [x] `frontend-developer`에게 실제 API DTO 및 엔드포인트 변경사항 인계
  - [x] `qa-tester`에게 에러 코드 및 유효성 검증 규칙 인계

### 🚩 Phase 3: 실제 연동 및 풀스택 QA (Integration & QA)
- [x] **Frontend 연동 & 품질 검증**:
  - [x] 실제 API Call 바인딩: `src/services/api.ts` 및 `SettingsProfileTab.tsx`
  - [x] 아키텍처 정적 분석 통과: `component_reviewer.py` (0 errors)
  - [x] 프로덕션 빌드 성공: `npm run build`
- [x] **QA 테스터 (`qa-tester`)**:
  - [x] 시나리오 테스트 문서 작성: `docs/qa/scenarios/user_profile.md` (Positive & Negative TC)
  - [x] 회귀 검증 통과
- [x] **마스터 문서 동기화**:
  - [x] 백엔드 API 색인: `docs/api/README.md`
  - [x] 프론트엔드 컴포넌트 색인: `docs/FRONTEND_SPECIFICATION.md`
  - [x] QA 시나리오 색인: `docs/qa/README.md`
