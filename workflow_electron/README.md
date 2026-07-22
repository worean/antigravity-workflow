# 💻 AntiGravity Workflow Electron (`workflow_electron`)

Electron + Vite + React 18 + TypeScript 기반의 이슈 & 작업 관리 시스템 데스크톱 클라이언트 애플리케이션입니다.

---

## 🎨 디자인 및 UI/UX 원칙 (Design Aesthetics)

- **Modern Dark Theme & Glassmorphism**: 세련된 아크릴/유리 질감 효과와 수려한 다크 테마 적용
- **Google Fonts**: `Outfit` / `Inter` 타이포그래피 활용
- **Micro-Animations**: 요소별 호버 반응 및 반응형 액션을 위한 미세 마이크로 애니메이션 적용
- **Vanilla CSS**: 일관된 디자인 시스템 토큰 구축 및 모듈화 스타일 적용

---

## ⚡ 백엔드 REST API 연동 (API Integration)

- **Backend Address**: `http://localhost:4000` (`workflow_server`)
- **인증 헤더**: 로그인 후 발급받은 JWT Access Token을 `Authorization: Bearer <jwt_token>` 헤더로 모든 API 요청 시 전송
- **주요 뷰 구성**:
  - `GoogleLoginCard.tsx`: 소셜/JWT 기반 로그인 뷰
  - `Dashboard.tsx`: 이슈 통계, 프로젝트 현황, 작업 트래킹 메인 대시보드

---

## 🛠️ 개발 및 빌드 스크립트 (Scripts)

```bash
# 의존성 설치
npm install

# Vite Dev Server + Electron 동시 실행 (개발 추천)
npm run electron:dev

# 웹 브라우저 전용 실행
npm run dev

# 빌드 (TypeScript 검사 + Vite 빌드)
npm run build
```

---

## 📝 파일 인코딩 지침
- 모든 소스 코드 및 Markdown 문서는 **`UTF-8 with BOM` (`utf-8-sig`)** 인코딩으로 작성하고 저장합니다.
