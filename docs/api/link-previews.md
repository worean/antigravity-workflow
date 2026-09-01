# 🔗 Link Previews API (`/api/link-previews`)

외부 웹페이지 링크의 OpenGraph 메타데이터(제목, 설명, 썸네일 이미지) 추출 및 캐시 저장을 담당합니다.

---

## 엔드포인트 목록

### 1. URL 메타데이터 파싱 및 캐시 저장
- **Endpoint**: `POST /api/link-previews`
- **Auth**: 불필요
- **Request Body**:
```json
{
  "url": "https://github.com"
}
```
- **Response (200 OK)**:
```json
{
  "id": 1,
  "url": "https://github.com",
  "title": "GitHub: Let’s build from here",
  "description": "GitHub is where over 100 million developers shape the future of software...",
  "image": "https://github.githubassets.com/assets/campaign-social-031d61163767.png",
  "domain": "github.com"
}
```

---

### 2. 저장된 링크 프리뷰 조회
- **Endpoint**: `GET /api/link-previews?url=https://github.com`
- **Auth**: 불필요
- **Response (200 OK)**: 링크 프리뷰 객체
