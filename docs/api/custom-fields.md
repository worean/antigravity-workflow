// -*- coding: utf-8 -*-
# ⚙️ Custom Fields API (`/api/custom-fields`)

프로젝트별 또는 전역 사용자 정의 필드(커스텀 필드) 스키마 정의 및 조회를 담당합니다.

---

## 엔드포인트 목록

### 1. 커스텀 필드 목록 조회
- **Endpoint**: `GET /api/custom-fields`
- **Auth**: 불필요
- **Query Parameters**:
  - `projectId` (number): 특정 프로젝트에 종속된 필드 및 전역 필드 필터링
- **Response (200 OK)**:
```json
[
  {
    "id": 1,
    "key": "deploy_target",
    "name": "배포 대상 환경",
    "fieldType": "SELECT",
    "schemaJson": "[\"DEV\", \"STAGING\", \"PROD\"]",
    "defaultValue": "DEV",
    "isRequired": false,
    "projectId": null
  }
]
```

---

### 2. 커스텀 필드 생성
- **Endpoint**: `POST /api/custom-fields`
- **Auth**: 불필요 (프로젝트 관리자)
- **Request Body**:
```json
{
  "key": "customer_id",
  "name": "고객사 식별자",
  "fieldType": "STRING",
  "isRequired": false,
  "projectId": 1
}
```
- **Response (201 Created)**: 생성된 필드 객체

---

### 3. 커스텀 필드 삭제
- **Endpoint**: `DELETE /api/custom-fields/:id`
- **Auth**: 불필요
- **Response (200 OK)**: `{ "message": "Custom field deleted" }`
