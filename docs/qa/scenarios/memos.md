# 📋 QA Test Case Specification: Shared Memos (워크스페이스 공유 메모장)

> **문서 상태**: Approved  
> **기능 ID**: `FEAT-SHARED-MEMO-01`  
> **대상 도메인**: `memos`  
> **상위 기능 사양**: [08_SHARED_MEMO_SPECIFICATION.md](file:///C:/Users/admin/antigravity-workflow/docs/features/08_SHARED_MEMO_SPECIFICATION.md)  
> **대상 컴포넌트**: [`MemosPage.tsx`](file:///C:/Users/admin/antigravity-workflow/workflow_react/src/pages/MemosPage.tsx), [`MemoDetailModal.tsx`](file:///C:/Users/admin/antigravity-workflow/workflow_react/src/components/memos/MemoDetailModal.tsx), [`MemoEditorModal.tsx`](file:///C:/Users/admin/antigravity-workflow/workflow_react/src/components/memos/MemoEditorModal.tsx), [`MemoMentionLink.tsx`](file:///C:/Users/admin/antigravity-workflow/workflow_react/src/components/memos/MemoMentionLink.tsx)  
> **관련 API 규격**: [`docs/api/memos.md`](file:///C:/Users/admin/antigravity-workflow/docs/api/memos.md)

---

## 1. Feature Overview (기능 개요)
- 이슈 종속성이 완전히 제거된 워크스페이스 독립 메모장 시스템.
- 공개/비공개 범위를 지원하여 워크스페이스 구성원 전체 열람 또는 작성자 전용 격리 제공.
- 마크다운 에디터 지원 및 파일당 최대 5MB 용량 제한 검증.
- `@메모제목` 멘션 하이퍼링크를 통해 앱 어디서든 Portal 팝업 모달로 메모 열람 지원.

---

## 2. Test Cases Matrix (테스트 케이스 명세)

| TC ID | 분류 | 시나리오 요약 | 사전 조건 | UI/UX 조작 절차 | 기대 결과 (API & UI/UX) | 성공 기준 |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **TC-MEMO-01** | `Positive` | 공개 메모 생성 및 워크스페이스 공유 조회 | 로그인 유저 A | 1. '새 메모 작성' 클릭<br>2. 제목, 마크다운 본문 입력 후 '워크스페이스 공개' 선택<br>3. '메모 생성' 클릭 | • API `POST /api/memos` 201 응답 (`isPublic: true`)<br>• 메모 목록에 녹색 '공개' 뱃지로 즉시 렌더링<br>• 동일 워크스페이스의 유저 B 목록에서도 정상 조회 | Pass |
| **TC-MEMO-02** | `Positive` | 5MB 이내 파일 첨부 및 다운로드 | 작성자 본인 로그인, 메모 존재 | 1. 메모 편집 모달에서 2MB 파일 첨부<br>2. 저장 완료 후 상세 모달 조회 | • API `POST /api/memos/:id/attachments` 201 응답<br>• 첨부파일 목록에 파일명 및 용량 표시<br>• 다운로드 링크 정상 작동 | Pass |
| **TC-MEMO-03** | `Positive` | `@메모제목` 멘션 클릭 시 전역 팝업 모달 열람 | 공개 메모 존재 (제목: "스프린트 기획") | 1. 텍스트 내 `@스프린트 기획` 하이퍼링크 클릭 | • 화면 중앙에 `MemoDetailModal` (Portal) 팝업 오픈<br>• 메모 제목, 작성자, 마크다운 본문 및 첨부파일 정상 렌더링 | Pass |
| **TC-MEMO-04** | `Negative` | 5MB 초과 파일 첨부 시도 차단 | 메모 편집 모달 진입 | 1. 5.1MB 이상의 파일 선택 업로드 | • 클라이언트에서 즉시 파일 차단 및 "최대 5MB를 초과할 수 없습니다" 경고 토스트 발생<br>• 서버 API에서도 400 Bad Request (`FILE_TOO_LARGE`)로 안전 차단 | Pass |
| **TC-MEMO-05** | `Negative` | 타인의 비공개 메모 접근 차단 | 유저 A가 비공개 메모 작성 (`isPublic: false`) | 1. 유저 B로 로그인하여 목록 조회 및 직접 ID URL 접근 | • 유저 B의 메모 목록에 해당 비공개 메모 미노출<br>• `GET /api/memos/:id` 직접 호출 시 403 Forbidden 반환<br>• 상세 모달에 '접근 권한이 없습니다' 안내 | Pass |
| **TC-MEMO-06** | `Negative` | 타인의 메모 수정 및 삭제 차단 | 유저 B로 로그인 | 1. 유저 A가 작성한 메모 상세 조회 | • 유저 B 화면에 '수정' 및 '삭제' 버튼 미노출<br>• `PUT` 또는 `DELETE` API 직접 호출 시 403 Forbidden 반환 | Pass |
| **TC-MEMO-07** | `Data Integrity` | 메모 메타데이터 및 첨부파일 데이터 일치성 검증 | 메모 생성 완료 (제목, 본문, 첨부파일 포함) | 1. 메모 카드 및 상세 모달 조회 | • API 응답 필드(`title`, `content`, `isPublic`, `author`, `attachments`)가 화면에 누락 없이 100% 매핑됨 | Pass |

---

## 3. Detailed Execution & Verification Log

### 🔹 TC-MEMO-01 & TC-MEMO-05 (공개/비공개 권한 격리 검증)
1. **Action**: `getMemosService` 및 `getMemoService` 호출 시 `workspaceId` 및 `authorId` 기반 WHERE 절 검증.
2. **Verification**:
   - `[Backend]` 비공개 메모 조회 시 `memo.authorId !== userId`이면 403 에러 발생 확인.
   - `[Frontend]` `MemoCard`의 공개/비공개 뱃지 및 `MemoDetailModal`의 권한 검증 확인.

### 🔹 TC-MEMO-04 (첨부파일 5MB 용량 제한 검증)
1. **Action**: 5,347,737 bytes(5.1MB) 파일 업로드 시도.
2. **Verification**:
   - `[Frontend]` `MemoAttachmentSection`에서 `file.size > MAX_FILE_SIZE`로 사전 차단 확인.
   - `[Backend]` `uploadMemoAttachmentService`에서 `fileSize > MAX_FILE_SIZE` 시 `FILE_TOO_LARGE` 400 에러 반환 확인.
