# 📅 12. Calendar Components Specification (캘린더 일정 컴포넌트 사양서)

## 1. 컴포넌트 개요
`CalendarPage`는 워크스페이스 내 모든 일감(이슈)과 스프린트 일정을 시각적인 **캘린더 뷰(월간/주간)**로 제공하며, **Google OAuth 로그인 사용자**에 한하여 **Google Calendar**와의 원클릭 동기화를 지원하는 컴포넌트입니다.

> [!IMPORTANT]
> **Google Calendar 연동 권한 제약**:
> - Google 계정으로 로그인한 유저(`isGoogleLinked === true`)만 구글 캘린더 동기화 버튼이 활성화됩니다.
> - 일반 이메일/비밀번호 가입 유저에게는 구글 로그인 전용 기능임을 알리는 안내 배너와 잠금 비활성화 상태가 제공됩니다.

---

## 2. 컴포넌트 계층 구조 (Component Hierarchy)

```mermaid
flowchart TD
    App[App.tsx] -->|activeTab === 'calendar'| Page[CalendarPage.tsx]
    Page --> SyncBanner[CalendarGoogleSyncBanner.tsx]
    Page --> Header[CalendarHeader.tsx]
    Page -->|viewMode === 'month'| MonthGrid[CalendarMonthGrid.tsx]
    Page -->|viewMode === 'week'| WeekGrid[CalendarWeekGrid.tsx]
    
    SyncBanner -->|동기화 실행| SyncMutation[useSyncGoogleCalendar]
    SyncBanner -->|결과 알림| Toast[useUIStore - showToast (3초 피드백)]
    Header -->|새 일감 클릭| GlobalModal[useUIStore - openIssueModal]
    MonthGrid -->|이벤트 클릭| Drawer[App.tsx - IssueDetailDrawer]
```

---

## 3. 서브 컴포넌트 상세 명세

### 3.1 `CalendarGoogleSyncBanner.tsx`
Google Calendar 연동 자격 상태에 따라 분기되는 동기화 안내 및 액션 배너입니다.

- **Props**:
  - `status?: GoogleCalendarStatus | null`: 구글 계정 연동 여부, 연동 이메일, 최종 동기화 시간
  - `isLoading?: boolean`: 상태 조회 로딩 여부
- **동작 원리**:
  - `isGoogleLinked === true`:
    - 연동된 구글 이메일 및 최종 동기화 시간 표시
    - `[구글 캘린더 동기화]` 버튼 제공 (로딩 시 회전 애니메이션)
    - 클릭 시 `useSyncGoogleCalendar` 호출 ➔ 성공 시 초록 토스트(3초), 실패 시 빨간 토스트(3초) 자동 노출
  - `isGoogleLinked === false`:
    - 🔒 `Google Calendar 연동 비활성화 (구글 로그인 전용)` 배너 노출
    - 동기화 버튼은 비활성화(disabled) 및 툴팁 제공

### 3.2 `CalendarHeader.tsx`
월/주 단위 날짜 네비게이션 및 필터 툴바 컴포넌트입니다.

- **Props**:
  - `currentDate: Date`: 현재 기준 일자
  - `viewMode: CalendarViewMode`: `'month' | 'week'`
  - `onViewModeChange: (mode: CalendarViewMode) => void`
  - `onPrev / onNext / onToday: () => void`: 일자 이동 핸들러
  - `projects: Project[]`: 프로젝트 필터 옵션 목록
  - `selectedProjectId: number | 'ALL'`
  - `onProjectChange: (projectId: number | 'ALL') => void`
  - `onNewIssue: () => void`: 이슈 생성 모달 트리거

### 3.3 `CalendarMonthGrid.tsx`
7열(일~토) x 5/6행의 월간 달력 그리드 컴포넌트입니다.

- **Props**:
  - `currentDate: Date`: 현재 선택된 월
  - `events: CalendarEvent[]`: 일정 목록
  - `onSelectEvent: (event: CalendarEvent) => void`: 이벤트 클릭 시 상세 열람
  - `onDateClick: (dateStr: string) => void`: 빈 날짜 클릭 시 해당 일자로 이슈 생성
- **시각화 규칙**:
  - 일요일(빨강), 토요일(파랑), 평일(회색) 요일 헤더
  - 오늘 일자 원형 파란 하이라이트
  - 이벤트 칩: 이슈 우선순위 색상(URGENT/HIGH: 빨강/주황, MEDIUM: 노랑, LOW: 파랑), 스프린트 마일스톤(보라색)
  - 완료된 이슈는 취소선 처리

### 3.4 `CalendarWeekGrid.tsx`
현재 선택된 주간의 7일을 가로 7열 컬럼 카드로 상세 렌더링하는 주간 집중 뷰 컴포넌트입니다.

- **Props**:
  - `currentDate: Date`
  - `events: CalendarEvent[]`
  - `onSelectEvent: (event: CalendarEvent) => void`
  - `onDateClick: (dateStr: string) => void`
- **시각화 규칙**:
  - 각 일자별 일정 카드 리스트 (프로젝트 태그, 상태 뱃지, 마감일, 담당자 아바타)

---

## 4. API 매핑 규격

| 컴포넌트 / 훅 | REST API 엔드포인트 | 메서드 | 설명 |
| :--- | :--- | :--- | :--- |
| `useCalendarEvents` | `/api/calendar/events` | `GET` | 워크스페이스 내 이슈 및 스프린트 일정 목록 조회 |
| `useGoogleCalendarStatus` | `/api/calendar/google/status` | `GET` | 로그인 유저의 Google Calendar 연동 자격 확인 |
| `useSyncGoogleCalendar` | `/api/calendar/sync/google` | `POST` | 워크스페이스 일정을 Google Calendar에 동기화 (구글 로그인 유저 전용) |

---

## 5. 검증 기준 (Definition of Done)
1. 모든 컴포넌트 파일 라인 수 400줄 미만 준수.
2. `react-component-reviewer` 정적 검사 통과 (0 errors, 0 warnings).
3. Google 로그인 사용자에게만 구글 캘린더 동기화 허용 및 비Google 유저 403 차단 방어.
4. 상단 네비게이션 및 사이드바에서 `calendar` 탭 및 URL Hash (`#/calendar`) 양방향 연동 완료.
