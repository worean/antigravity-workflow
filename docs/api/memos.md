# 📝 Memos API (`/api/memos`)

워크스페이스 공유 메모 생성, 조회, 수정, 삭제 및 첨부파일 관리를 담당합니다.

---

## 엔드포인트 목록

### 1. 메모 목록 조회
- **Endpoint**: `GET /api/memos`
- **Auth**: `Bearer <token>` (필수)
- **Query Parameters**:
  - `workspaceId` (number, 기본: 1)
  - `search` (string): 제목 또는 본문 검색 키워드
  - `filter` (`all` | `public` | `my`, 기본: `all`)
- **Response (200 OK)**:
```json
[
  {
    "id": 1,
    "workspaceId": 1,
    "authorId": 1,
    "title": "2026 백엔드 인프라 아키텍처 메모",
    "content": "# 아키텍처 개요\n- 3-Tier Layered 구조",
    "isPublic": true,
    "author": { "id": 1, "name": "홍길동", "email": "user@example.com", "avatar": null },
    "attachments": [],
    "createdAt": "2026-10-06T12:00:00.000Z",
    "updatedAt": "2026-10-06T12:30:00.000Z"
  }
]
```

---

### 2. 새 메모 생성
- **Endpoint**: `POST /api/memos`
- **Auth**: `Bearer <token>` (필수)
- **Request Body**:
```json
{
  "title": "2026 백엔드 인프라 아키텍처 메모",
  "content": "# 아키텍처 개요\n- 3-Tier Layered 구조",
  "isPublic": true,
  "workspaceId": 1
}
```
- **Response (201 Created)**: 생성된 Memo 객체

---

### 3. 메모 단건 상세 조회
- **Endpoint**: `GET /api/memos/:id`
- **Auth**: `Bearer <token>` (필수)
- **권한 제약**: 비공개 메모(`isPublic: false`)인 경우 작성자가 아니면 `403 Forbidden` 반환.
- **Response (200 OK)**:
```json
{
  "id": 1,
  "workspaceId": 1,
  "authorId": 1,
  "title": "2026 백엔드 인프라 아키텍처 메모",
  "content": "# 아키텍처 개요\n- 3-Tier Layered 구조",
  "isPublic": true,
  "author": { "id": 1, "name": "홍길동", "email": "user@example.com", "avatar": null },
  "attachments": [],
  "createdAt": "2026-10-06T12:00:00.000Z",
  "updatedAt": "2026-10-06T12:30:00.000Z"
}
```

---

### 4. `@` 멘션 링크용 제목 기반 조회
- **Endpoint**: `GET /api/memos/by-title/:title`
- **Auth**: `Bearer <token>` (필수)
- **Response (200 OK)**: Memo 상세 객체

---

### 5. 메모 수정
- **Endpoint**: `PUT /api/memos/:id`
- **Auth**: `Bearer <token>` (필수, 작성자 전용)
- **Request Body**:
```json
{
  "title": "수정된 메모 제목",
  "content": "수정된 마크다운 내용",
  "isPublic": false
}
```
- **Response (200 OK)**: 수정된 Memo 객체

---

### 6. 메모 삭제
- **Endpoint**: `DELETE /api/memos/:id`
- **Auth**: `Bearer <token>` (필수, 작성자 전용)
- **Response (200 OK)**:
```json
{
  "success": true,
  "deletedId": 1
}
```

---

### 7. 메모 첨부파일 등록 (최대 5MB 제한)
- **Endpoint**: `POST /api/memos/:id/attachments`
- **Auth**: `Bearer <token>` (필수, 작성자 전용)
- **Request Body**:
```json
{
  "fileName": "diagram.png",
  "fileSize": 1048576,
  "fileUrl": "https://storage.example.com/diagram.png",
  "fileType": "image/png"
}
```
- **Response (201 Created)**: 등록된 MemoAttachment 객체
- **에러 응답 (400 Bad Request)**:
```json
{
  "error": "FILE_TOO_LARGE",
  "message": "첨부파일 크기는 최대 5MB(5,242,880 bytes)를 초과할 수 없습니다."
}
```

---

### 8. 메모 첨부파일 삭제
- **Endpoint**: `DELETE /api/memos/:id/attachments/:attachmentId`
- **Auth**: `Bearer <token>` (필수, 작성자 전용)
- **Response (200 OK)**:
```json
{
  "success": true,
  "deletedAttachmentId": 10
}
```
