// -*- coding: utf-8 -*-
# 🏢 Groups & Organization API (`/api/groups`)

회사 조직도, 본부/팀/부서 계층 구조(Hierarchy) 및 그룹 관리를 담당합니다.

---

## 📌 서브 라우트 목차
- **[그룹 멤버 관리](./members.md)**: `POST/PUT/DELETE /api/groups/:id/members`

---

## 기본 CRUD 엔드포인트

### 1. 그룹 목록 및 조직 트리 조회
- **Endpoint**: `GET /api/groups`
- **Auth**: `Bearer <token>` (필수)
- **Response (200 OK)**:
```json
[
  {
    "id": 1,
    "name": "개발본부",
    "code": "DEV_HQ",
    "parentId": null,
    "children": [
      {
        "id": 2,
        "name": "플랫폼개발팀",
        "code": "PLATFORM_DEV",
        "parentId": 1
      }
    ],
    "members": []
  }
]
```

---

### 2. 그룹 단건 조회
- **Endpoint**: `GET /api/groups/:id`
- **Auth**: `Bearer <token>` (필수)
- **Response (200 OK)**: 그룹 상세 정보 (상위/하위 그룹 및 소속 멤버 포함)

---

### 3. 신규 그룹(부서) 생성
- **Endpoint**: `POST /api/groups`
- **Auth**: `Bearer <token>` (관리자 권한)
- **Request Body**:
```json
{
  "name": "프론트엔드 파트",
  "code": "FE_PART",
  "description": "웹 프론트엔드 개발 전담",
  "parentId": 2
}
```
- **Response (201 Created)**: 생성된 그룹 객체

---

### 4. 그룹 정보 수정
- **Endpoint**: `PUT /api/groups/:id`
- **Auth**: `Bearer <token>` (관리자 권한)
- **Request Body**: `Partial<Group>`
- **Response (200 OK)**: 갱신된 그룹 객체

---

### 5. 그룹 삭제
- **Endpoint**: `DELETE /api/groups/:id`
- **Auth**: `Bearer <token>` (관리자 권한)
- **Response (200 OK)**: `{ "message": "Group deleted successfully" }`
