# 📋 워크스페이스 공유 메모장(Shared Memo) Feature Specification & Planning Document

> **문서 상태**: Approved  
> **기능 ID**: `FEAT-SHARED-MEMO-01`  
> **대상 도메인**: `memos`  
> **작성자 / 일자**: AntiGravity Spec Planner / 2026-10-06  
> **관련 문서**: [GEMINI.md](file:///C:/Users/admin/antigravity-workflow/GEMINI.md) (개발 표준 파이프라인 준수)

---

## 1. 기능 개요 및 사용자 가치 (Feature Overview)

### 1.1 배경 및 목적 (Background & Objective)
- **배경**: 기존 로컬스토리지 기반 개인 메모장은 다른 팀원과의 지식 공유가 불가능하고, 브라우저가 변경되면 데이터가 유실되는 한계가 있었습니다. 또한 기존에는 이슈에 종속된 메모 형태였으나, 이제 프로젝트 전반에 걸친 독립적인 지식 관리 및 아이디어 메모의 필요성이 대두되었습니다.
- **목적**: 백엔드 데이터베이스 기반의 영속적이고 안전한 **워크스페이스 공유 메모장(Shared Memo)** 시스템을 구축합니다. 메모는 이슈 종속성을 완전히 제거하고 독립적으로 운영되며, **공개/비공개 설정**을 통해 워크스페이스 내 팀원들과 안전하게 공유할 수 있습니다. 마크다운 에디터와 **최대 5MB 파일 첨부 기능**을 제공하며, 시스템 어디서든 **`@메모제목` 멘션 링킹**을 통해 하이퍼링크 및 팝업 모달로 메모를 즉시 조회할 수 있는 생산성 도구를 완성합니다.

### 1.2 핵심 사용자 시나리오 (User Journey & Core Value)
1. **독립 메모 작성 및 공개 범위 설정**:
   - 사용자는 메모 전용 페이지에서 새 메모를 작성할 수 있습니다.
   - 제목, 마크다운 본문, 공개 여부(`isPublic: true/false`)를 지정합니다.
   - **공개 메모**: 로그인된 동일 워크스페이스의 모든 구성원이 읽기 가능합니다.
   - **비공개 메모**: 작성자 본인만 조회, 수정, 삭제할 수 있습니다.
2. **파일 첨부 지원 (5MB 용량 제한)**:
   - 메모 본문과 함께 이미지, 문서 등 첨부파일을 업로드할 수 있습니다.
   - 개별 파일 크기는 **최대 5MB**로 제한되며, 초과 시 즉각적인 클라이언트/서버 유효성 경고를 제공합니다.
3. **`@` 멘션을 통한 전역 메모 링크 및 팝업 모달 조회**:
   - 이슈 본문, 댓글, 다른 메모 내용 등에서 `@메모제목`을 입력하면 해당 메모로 연결되는 하이퍼링크가 생성됩니다.
   - 링크 클릭 시 페이지 이동 없이 화면 중앙에 **`MemoDetailModal` (Portal 팝업 모달)**이 즉시 열려 메모 내용과 첨부파일을 어디서든 빠르게 확인할 수 있습니다.

### 1.3 사용자 권한 및 접근 제어 (Authorization & Scope)
- **워크스페이스 격리**: 모든 메모는 특정 `workspaceId`에 귀속되며, 타 워크스페이스 유저는 접근이 엄격히 차단됩니다.
- **수정/삭제 권한**: 공개 여부와 무관하게 메모의 수정 및 삭제는 **오직 작성자(Author)** 본인만 가능합니다.
- **열람 권한**:
  - 공개 메모: 동일 워크스페이스 소속 인증 유저 전원 열람 가능.
  - 비공개 메모: 작성자 본인만 열람 가능 (타 유저 요청 시 403 Forbidden).

---

## 2. 데이터 모델 및 비즈니스 규칙 (Data Model & Business Rules)

### 2.1 데이터베이스 스키마 요구사항 (Prisma Schema Target)
`workflow_server/prisma/schema.workspace.prisma`에 추가할 데이터 모델 명세입니다:

```prisma
// workflow_server/prisma/schema.workspace.prisma

model Memo {
  id          Int              @id @default(autoincrement())
  workspaceId Int              @map("workspace_id")
  authorId    Int              @map("author_id")
  title       String           @db.VarChar(200)
  content     String           @db.Text
  isPublic    Boolean          @default(false) @map("is_public")
  createdAt   DateTime         @default(now()) @map("created_at")
  updatedAt   DateTime         @updatedAt @map("updated_at")

  attachments MemoAttachment[]

  @@index([workspaceId, isPublic])
  @@index([authorId])
  @@index([workspaceId, title])
  @@map("memos")
}

model MemoAttachment {
  id        Int      @id @default(autoincrement())
  memoId    Int      @map("memo_id")
  fileName  String   @map("file_name") @db.VarChar(255)
  fileSize  Int      @map("file_size") // bytes (Max 5,242,880)
  fileUrl   String   @map("file_url") @db.VarChar(500)
  fileType  String?  @map("file_type") @db.VarChar(100)
  createdAt DateTime @default(now()) @map("created_at")

  memo      Memo     @relation(fields: [memoId], references: [id], onDelete: Cascade)

  @@index([memoId])
  @@map("memo_attachments")
}
```

### 2.2 필드 상세 명세 및 제약조건 (Field Constraints)
| 테이블 | 필드명 | 타입 | 필수 여부 | 기본값 | 제약조건 / 유효성 검사 규칙 |
| :--- | :--- | :--- | :---: | :--- | :--- |
| `Memo` | `id` | Int | 필수 | autoincrement | 기본키 (Primary Key) |
| `Memo` | `workspaceId` | Int | 필수 | - | 현재 활성 워크스페이스 고유 식별자 |
| `Memo` | `authorId` | Int | 필수 | - | 작성자 사용자 ID (`jwt.verify` -> `payload.userId`) |
| `Memo` | `title` | String | 필수 | - | 1자 이상 200자 이하의 메모 제목 (`@` 참조용) |
| `Memo` | `content` | String (Text)| 필수 | `""` | Markdown 형식의 본문 텍스트 (최대 50,000자) |
| `Memo` | `isPublic` | Boolean | 필수 | `false` | 워크스페이스 공개 여부 (`true`: 전체 공개, `false`: 비공개) |
| `MemoAttachment` | `fileSize` | Int | 필수 | - | **최대 5MB (5,242,880 bytes)** 제한 |
| `MemoAttachment` | `memoId` | Int | 필수 | - | 외래키, 메모 삭제 시 연쇄 삭제 (`Cascade`) |

---

## 3. 백엔드 REST API 명세 (Backend REST API Specification)

### 3.1 엔드포인트 목록
모든 요청은 `Authorization: Bearer <token>` 헤더를 필수로 요구합니다.

| Method | Endpoint | 설명 | 인증/인가 |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/memos` | 메모 목록 조회 (공개 메모 + 본인 비공개 메모) | 로그인 유저 (`workspaceId` 격리) |
| `POST` | `/api/memos` | 새 메모 생성 | 로그인 유저 |
| `GET` | `/api/memos/:id` | 메모 단건 상세 조회 (첨부파일 목록 포함) | 작성자 또는 공개 메모의 워크스페이스 멤버 |
| `PUT` | `/api/memos/:id` | 메모 수정 (제목, 본문, 공개 여부) | **작성자 본인만 (403 차단)** |
| `DELETE` | `/api/memos/:id` | 메모 삭제 | **작성자 본인만 (403 차단)** |
| `POST` | `/api/memos/:id/attachments` | 메모 첨부파일 등록 (최대 5MB) | 작성자 본인만 |
| `DELETE` | `/api/memos/:id/attachments/:attachmentId` | 메모 첨부파일 삭제 | 작성자 본인만 |
| `GET` | `/api/memos/by-title/:title` | `@` 멘션 링크용 제목 기반 단건 조회 | 공개 메모 또는 본인 비공개 메모 |

### 3.2 요청 및 응답 샘플 (JSON)

#### 1) 메모 생성 요청 (`POST /api/memos`)
```json
{
  "title": "2026 백엔드 인프라 아키텍처 메모",
  "content": "# 아키텍처 개요\n- 3-Tier Layered 구조 채택\n- Prisma ORM 연동",
  "isPublic": true
}
```

#### 2) 메모 단건 조회 응답 (`GET /api/memos/:id`)
```json
{
  "id": 1,
  "workspaceId": 1,
  "authorId": 1,
  "title": "2026 백엔드 인프라 아키텍처 메모",
  "content": "# 아키텍처 개요\n- 3-Tier Layered 구조 채택\n- Prisma ORM 연동",
  "isPublic": true,
  "author": {
    "id": 1,
    "name": "홍길동",
    "email": "user@example.com"
  },
  "attachments": [
    {
      "id": 10,
      "memoId": 1,
      "fileName": "architecture_diagram.png",
      "fileSize": 1048576,
      "fileUrl": "/uploads/memos/1/architecture_diagram.png",
      "fileType": "image/png",
      "createdAt": "2026-10-06T13:00:00.000Z"
    }
  ],
  "createdAt": "2026-10-06T12:00:00.000Z",
  "updatedAt": "2026-10-06T12:30:00.000Z"
}
```

#### 3) 첨부파일 용량 초과 에러 응답 (`400 Bad Request`)
```json
{
  "error": "FILE_TOO_LARGE",
  "message": "첨부파일 크기는 최대 5MB(5,242,880 bytes)를 초과할 수 없습니다."
}
```

---

## 4. 프론트엔드 UI/UX 사양 (Frontend UI/UX Specification)

### 4.1 서브 컴포넌트 모듈화 계획 (Max 400줄 준수)
모든 컴포넌트는 `workflow_react/src/components/memos/` 디렉터리에 모듈화하여 배치하며, 단일 파일 400줄 제한을 엄격히 준수합니다:

- `src/components/memos/MemoList.tsx`: 메모 카드 그리드 뷰, 필터(전체/공개/내 메모), 검색 바
- `src/components/memos/MemoCard.tsx`: 개별 메모 카드 컴포넌트 (공개 여부 뱃지, 첨부파일 개수 표시)
- `src/components/memos/MemoEditorModal.tsx`: 메모 작성/수정 모달 (마크다운 에디터 + 5MB 파일 드래그앤드롭 업로더)
- `src/components/memos/MemoDetailModal.tsx`: 전역 팝업 모달 (`@` 멘션 클릭 및 카드 클릭 시 노출, Portal 렌더링)
- `src/components/memos/MemoMentionLink.tsx`: 텍스트 내 `@메모제목`을 감지하여 하이퍼링크로 치환하는 렌더러
- `src/components/memos/index.ts`: Barrel Export

### 4.2 병렬 개발용 Mock Data & TypeScript DTO 계약
프론트엔드 개발자가 백엔드 완료를 기다리지 않고 UI를 즉시 개발할 수 있도록 제공되는 Mock 데이터셋입니다:

```typescript
// workflow_react/src/types/memo.ts

export interface MemoAttachmentDto {
  id: number;
  memoId: number;
  fileName: string;
  fileSize: number;
  fileUrl: string;
  fileType: string;
  createdAt: string;
}

export interface MemoDto {
  id: number;
  workspaceId: number;
  authorId: number;
  title: string;
  content: string;
  isPublic: boolean;
  author?: {
    id: number;
    name: string;
    email: string;
  };
  attachments: MemoAttachmentDto[];
  createdAt: string;
  updatedAt: string;
}

export const MOCK_MEMO_ITEMS: MemoDto[] = [
  {
    id: 1,
    workspaceId: 1,
    authorId: 1,
    title: "스프린트 기획 회의록",
    content: "# 스프린트 4차 회의\n- 메모 기능 백엔드 이관 완료\n- `@멘션` 기능 검증 예정",
    isPublic: true,
    author: { id: 1, name: "관리자", email: "admin@example.com" },
    attachments: [
      {
        id: 1,
        memoId: 1,
        fileName: "sprint_plan.pdf",
        fileSize: 204800,
        fileUrl: "https://example.com/sprint_plan.pdf",
        fileType: "application/pdf",
        createdAt: "2026-10-06T10:00:00.000Z"
      }
    ],
    createdAt: "2026-10-06T10:00:00.000Z",
    updatedAt: "2026-10-06T10:00:00.000Z"
  },
  {
    id: 2,
    workspaceId: 1,
    authorId: 1,
    title: "개인 보안 키 보관 메모",
    content: "## 비공개 키 목록\n- 테스트용 토큰 저장 (외부 노출 금지)",
    isPublic: false,
    author: { id: 1, name: "관리자", email: "admin@example.com" },
    attachments: [],
    createdAt: "2026-10-06T11:00:00.000Z",
    updatedAt: "2026-10-06T11:00:00.000Z"
  }
];
```

---

## 5. QA 및 통합 테스트 시나리오 (QA & Integration Test Scenarios)

### 5.1 Positive 테스트 케이스 (TC-POS)
- `TC-POS-01`: 사용자가 공개 메모를 작성(`isPublic: true`)하면 동일 워크스페이스의 다른 유저 목록에 정상 표시되어야 한다.
- `TC-POS-02`: 사용자가 3MB 크기의 파일을 첨부하면 성공적으로 업로드되고 첨부 목록에 표시되어야 한다.
- `TC-POS-03`: 다른 게시물이나 메모에서 `@스프린트 기획 회의록` 텍스트를 클릭하면 `MemoDetailModal` 팝업이 즉시 열리고 마크다운 본문이 렌더링되어야 한다.

### 5.2 Negative 테스트 케이스 (TC-NEG)
- `TC-NEG-01`: 5.1MB 크기의 첨부파일을 업로드 시도할 경우, 즉시 400 Bad Request 에러 및 "최대 5MB를 초과할 수 없습니다" 경고가 발생해야 한다.
- `TC-NEG-02`: 타 유저가 작성한 비공개 메모(`isPublic: false`)를 조회하거나 수정을 시도할 경우 403 Forbidden 에러가 반환되어야 한다.
- `TC-NEG-03`: 다른 워크스페이스의 메모 ID를 조회 시도할 경우 404 Not Found 또는 403 Forbidden으로 접근이 차단되어야 한다.

---

## 6. 개발 파이프라인 산출물 체크리스트 (Deliverables Checklist)

- [ ] **Phase 0 (spec-planner)**: 사양서 작성 및 `spec_validator.py` 통과 (`08_SHARED_MEMO_SPECIFICATION.md`)
- [ ] **Phase 1 (backend-developer)**: Prisma 모델 추가, 3-Tier 모듈(`src/modules/memos/`), Vitest 단위 테스트 100% Pass
- [ ] **Phase 1 (frontend-developer)**: 서브 컴포넌트(`src/components/memos/`), Mock 연동 UI 선행 개발
- [ ] **Phase 2 (api-viewer)**: `api_inspector.py` 정합성 검증, FE/QA 인계 패킷 전달
- [ ] **Phase 3 (frontend-developer)**: 실제 API 연동, `component_reviewer.py` 0 errors, `npm run build` 성공
- [ ] **Phase 3 (qa-tester)**: 시나리오 TC(`docs/qa/scenarios/memos.md`), `qa_runner.py --run-all` 회귀 테스트 통과
