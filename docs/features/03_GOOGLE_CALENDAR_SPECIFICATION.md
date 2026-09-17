# 📅 AntiGravity Google Calendar Integration & Schedule View Specification (캘린더 연동 및 일정 관리 기획 사양서)

## 1. 기획 개요 및 배경
- **목적**: 개인 업무 일정과 소규모 프로젝트의 마일스톤/이슈 일정을 시각적인 **캘린더 뷰(월간/주간/일간)**에서 직관적으로 관리하고, **Google Calendar**와의 실시간 동기화를 통해 모바일 알림 및 일정 누락을 방지합니다.
- **핵심 가치**:
  1. Full Calendar 스타일의 월간/주간/일간/아젠다 뷰 제공.
  2. 캘린더 상에서 드래그 앤 드롭으로 이슈 시작일/마감일(Due Date) 즉시 변경.
  3. Google Calendar API 연동을 통한 양방향 동기화 (AntiGravity ➔ Google Calendar 자동 일정 등록/갱신).
  4. 구글 캘린더 개인 일정(Meeting, 휴가 등)을 AntiGravity 캘린더에 오버레이 표시.

---

## 2. 시스템 아키텍처 및 동기화 흐름

```mermaid
flowchart TD
    User[사용자 캘린더 인터랙션] --> CalView[CalendarPage & FullCalendar Component]
    CalView -->|1. 일정 드래그/수정| IssueAPI[api/issues.ts - updateIssue]
    IssueAPI --> Server[Express Server: issues.controller]
    Server -->|2. Workspace DB 업데이트| DB[(Issue Table)]
    Server -->|3. Google Calendar Sync 트리거| GSync[services/googleCalendarSync.service.ts]
    GSync -->|4. Google Calendar API v3| GCal[(Google Calendar Server)]
    GCal -->>UserMobile[사용자 스마트폰 구글 캘린더 알림 수신]
```

---

## 3. 세부 기능 요구사항 (Functional Requirements)

### 3.1 프론트엔드 UI 컴포넌트 (`CalendarPage.tsx` & `components/calendar/`)
1. **캘린더 뷰 네비게이션**:
   - 뷰 모드 전환: 월간(Month), 주간(Week), 일간(Day), 타임라인 리스트(List/Agenda).
   - 프로젝트별 색상 구분(Color Coding) 및 담당자/상태 필터링.
2. **캘린더 인터랙션 (DnD & Modal)**:
   - 날짜 셀 클릭 시 "빠른 일정/이슈 등록" 팝오버 오픈.
   - 캘린더 이벤트 바(Event Bar)를 다른 날짜로 드래그 시 시작일/마감일 실시간 부분 갱신 (Optimistic Update).
   - 이벤트 클릭 시 `IssueDetailDrawer` 슬라이드 오픈.
3. **Google Calendar 동기화 상태 바**:
   - "구글 캘린더 연동됨 (마지막 동기화: 방금 전)" 상태 배너.
   - 수동 동기화(Sync Now) 버튼 및 동기화할 구글 캘린더 선택 옵션.

### 3.2 백엔드 Google Calendar 연동 엔진
1. **Google Calendar API v3 클라이언트 (`#lib/googleCalendar.ts`)**:
   - `SocialAccount`에 보관된 OAuth `refreshToken`을 이용하여 Google API Access Token 자동 갱신.
   - Google Calendar Event 생성/수정/삭제 (`events.insert`, `events.patch`, `events.delete`).
2. **이슈 이벤트 동기화 규칙**:
   - 이슈에 `plannedStartDate` 및 `dueDate`가 설정되면 구글 캘린더에 `[AGY] 이슈제목` 형태로 종일 이벤트 또는 시간제 일정 등록.
   - 이슈 상태가 `DONE`으로 변경되면 캘린더 이벤트 제목에 `[완료]` 프리픽스 추가 및 설명 동기화.
3. **API 엔드포인트 (`src/modules/calendar/`)**:
   - `GET /api/calendar/events`: 워크스페이스 내 모든 이슈 및 마일스톤 일정 캘린더 포맷 조회.
   - `POST /api/calendar/sync/google`: 구글 캘린더 즉시 수동 동기화 실행.
   - `GET /api/calendar/google/events`: 사용자 구글 캘린더의 외부 개인 일정 가져오기 (오버레이 표시용).

---

## 4. 백엔드/프론트엔드 산출물 목록

- **API 스펙 문서**: [`docs/api/calendar/get-events.md`](file:///C:/Users/admin/antigravity-workflow/docs/api/calendar/get-events.md), [`sync-google.md`](file:///C:/Users/admin/antigravity-workflow/docs/api/calendar/sync-google.md)
- **컴포넌트 사양서**: [`docs/components/12_CALENDAR_COMPONENTS.md`](file:///C:/Users/admin/antigravity-workflow/docs/components/12_CALENDAR_COMPONENTS.md)
- **프론트 소스**: `src/pages/CalendarPage.tsx`, `src/components/calendar/*`
- **백엔드 소스**: `src/modules/calendar/*`
- **단위 테스트**: `src/tests/calendar.sync.test.ts`
