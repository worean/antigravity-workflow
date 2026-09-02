# 🗺️ AntiGravity Personal & Team Expansion Master Roadmap (프로젝트 확장 마스터 로드맵)

## 1. 프로젝트 비전 (Product Vision)
> **"개인의 완벽한 업무 처리 및 일정 관리부터, 소규모 팀의 유기적인 협업까지 아우르는 올인원 생산성 플랫폼"**

본 로드맵은 AntiGravity 시스템을 개인 전용 업무/일정 관리 도구이자 외부 동료들이 쉽게 참여할 수 있는 소규모 협업 플랫폼으로 발전시키기 위한 **3대 핵심 기능 확장 계획**을 정의합니다.

---

## 2. 3대 핵심 확장 기능 및 구현 단계

```mermaid
gantt
    title AntiGravity 기능 확장 로드맵 (Pipeline Execution)
    dateFormat  YYYY-MM-DD
    section 1. Google OAuth 인증
    기획 및 API 스펙 산출물 작성       :done,    des1, 2026-09-01, 1d
    소셜 계정 모델 & 백엔드 OAuth 연동  :active,  dev1, 2026-09-02, 2d
    AuthModal & Onboarding UX 구현   :         dev2, 2026-09-03, 2d
    section 2. 완성형 첨부파일 시스템
    첨부파일 사양서 & Dropzone 설계     :done,    des2, 2026-09-01, 1d
    Multer 업로드 & 로컬 스토리지 구축  :         dev3, 2026-09-04, 2d
    이슈/댓글/채팅 파일 연동 UI 구현    :         dev4, 2026-09-05, 2d
    section 3. 캘린더 & Google Calendar
    캘린더 뷰 & 동기화 엔진 사양서 작성  :done,    des3, 2026-09-01, 1d
    CalendarPage & Full DnD 캘린더   :         dev5, 2026-09-06, 3d
    Google Calendar API v3 양방향 동기화:         dev6, 2026-09-08, 3d
```

---

## 3. 단계별 개발 파이프라인 적용 가이드

### Phase 1: Google OAuth 간편 가입 & 온보딩
- **목표**: 외부 사용자가 이메일/비밀번호 없이 1초 만에 구글 계정으로 로그인하고 개인 워크스페이스를 자동 생성.
- **파이프라인 산출물**:
  1. `docs/features/01_GOOGLE_OAUTH_SPECIFICATION.md`
  2. `docs/api/auth/google-oauth.md`
  3. `src/modules/auth/services/googleOAuth.service.ts`
  4. `src/components/AuthModal.tsx` 개편
  5. `src/tests/auth.googleOAuth.test.ts` (100% Pass)

### Phase 2: 완전한 통합 파일 첨부 시스템 (Attachments)
- **목표**: 이슈, 댓글, 채팅에서 드래그 앤 드롭 및 클립보드 이미지 붙여넣기(Ctrl+V) 지원.
- **파이프라인 산출물**:
  1. `docs/features/02_ATTACHMENTS_SPECIFICATION.md`
  2. `docs/api/attachments/upload.md`
  3. `src/components/common/FileDropzone.tsx`, `AttachmentList.tsx`, `ImageLightboxModal.tsx`
  4. `src/modules/attachments/services/uploadAttachment.service.ts`
  5. `src/tests/attachments.upload.test.ts`

### Phase 3: 인터랙티브 캘린더 뷰 & Google Calendar 양방향 동기화
- **목표**: 월간/주간 캘린더 뷰에서 일정을 한눈에 조망하고 드래그로 일정을 변경하며, 구글 캘린더와 자동 동기화.
- **파이프라인 산출물**:
  1. `docs/features/03_GOOGLE_CALENDAR_SPECIFICATION.md`
  2. `docs/components/12_CALENDAR_COMPONENTS.md`
  3. `src/pages/CalendarPage.tsx`, `src/components/calendar/*`
  4. `src/modules/calendar/services/googleCalendarSync.service.ts`
  5. `src/tests/calendar.sync.test.ts`
