# 📎 AntiGravity Complete File Attachments Specification (첨부파일 시스템 기획 사양서)

## 1. 기획 개요 및 배경
- **목적**: 이슈(Issue), 댓글(Comment), 작업로그(Worklog), 채팅(Chat) 등 작업 전반에 걸쳐 이미지, 문서(PDF, Word), 압축 파일(ZIP) 등을 자유롭게 업로드하고 열람할 수 있는 통합 파일 시스템 구축.
- **핵심 가치**:
  1. 클립보드 이미지 캡처(Ctrl+V) 및 드래그 앤 드롭(Drag & Drop) 즉시 첨부.
  2. 이미지 인라인 미리보기(Lightbox Modal) 및 다운로드.
  3. 로컬 파일 스토리지(`/uploads`) 및 파일 용량/MIME 타입 안전성 검증.

---

## 2. 시스템 아키텍처 및 데이터 흐름

```mermaid
flowchart TD
    User[사용자 UI: 이슈/댓글/채팅창] -->|Drag & Drop or Ctrl+V| Dropzone[File Dropzone / Paste Handler]
    Dropzone -->|FormData: multipart/form-data| ClientAPI[api/attachments.ts - TanStack Mutation]
    ClientAPI -->|POST /api/attachments/upload| Server[Express Server - Multer Middleware]
    Server -->|1. 파일 디스크 저장| Storage[(Local /uploads/ Directory)]
    Server -->|2. 메타데이터 DB 저장| DB[(Workspace DB - Attachment Table)]
    Server -->>ClientAPI| Attachment JSON Response (url, filename, size, mimeType)
    ClientAPI -->|Markdown 주입 or Attachment List 갱신| UI[화면 썸네일 & 파일 리스트 즉시 렌더링]
```

---

## 3. 세부 기능 요구사항 (Functional Requirements)

### 3.1 프론트엔드 UI 컴포넌트
1. **`FileDropzone` & `AttachmentList` 컴포넌트 (`components/common/`)**:
   - 파일 드래그 앤 드롭 영역 및 파일 선택 버튼.
   - 업로드 진행률 프로그레스 바.
   - 파일 유형별 아이콘 뱃지 (PDF, 이미지, 코드, 압축파일 등), 파일 크기(KB/MB 포맷).
   - 삭제 확인 및 원클릭 다운로드.
2. **`ImageLightboxModal` (이미지 확대 뷰어)**:
   - 첨부된 이미지 클릭 시 전체 화면 확대, 줌 인/아웃, 원본 다운로드 기능.
3. **Markdown 에디터 연동**:
   - 에디터 본문에 이미지 드롭 또는 붙여넣기 시 자동으로 업로드 후 `![image.png](/uploads/...)` 마크다운 태그 자동 삽입.

### 3.2 백엔드 스토리지 및 API
1. **파일 업로드 미들웨어 (`multer`)**:
   - 저장 경로: `workflow_server/public/uploads/{year}/{month}/`
   - 파일명 중복 방지: UUID + 타임스탬프 해시 명명 규칙.
   - 파일 크기 제한: 단일 파일 최대 50MB.
   - 허용 MIME 타입: 이미지(PNG, JPG, GIF, WebP, SVG), 문서(PDF, DOCX, XLSX, TXT), 압축(ZIP, TAR).
2. **API 엔드포인트**:
   - `POST /api/attachments/upload`: `multipart/form-data` 멀티 파일 업로드 ➔ `Attachment[]` 생성.
   - `GET /api/attachments/issue/:issueId`: 특정 이슈의 첨부파일 목록 조회.
   - `DELETE /api/attachments/:id`: 파일 물리 삭제 및 DB 레코드 제거.
   - `GET /uploads/*`: 정적 파일 서빙 미들웨어 (`express.static`).

---

## 4. 백엔드/프론트엔드 산출물 목록

- **API 스펙 문서**: [`docs/api/attachments/upload.md`](file:///C:/Users/admin/antigravity-workflow/docs/api/attachments/upload.md), [`delete.md`](file:///C:/Users/admin/antigravity-workflow/docs/api/attachments/delete.md)
- **프론트 컴포넌트**: `src/components/common/FileDropzone.tsx`, `src/components/common/AttachmentList.tsx`, `src/components/common/ImageLightboxModal.tsx`
- **백엔드 서비스**: `src/modules/attachments/services/uploadAttachment.service.ts`, `deleteAttachment.service.ts`
- **단위 테스트**: `src/tests/attachments.upload.test.ts`
