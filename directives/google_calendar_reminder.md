# Google 캘린더 일정 및 기한 기반 리마인드 지침 (SOP)

이 지침서는 등록된 Google 계정의 캘린더를 참조하여 오늘 해야 할 일들을 분석하고, 일정의 기한과 완료 여부에 따라 지연되었거나 마감이 임박한 일정을 리마인드하는 자동화 워크플로우의 구성 및 운영 방법을 정의합니다.

## 1. 개요 및 목적
1. Google Calendar API를 연동하여 조회 당일의 일정(00:00:00 ~ 23:59:59)을 실시간으로 가져옵니다.
2. 각 일정의 시작/종료 시간과 현재 시간을 비교하여 일정을 상태별로 분류합니다.
3. 일정의 제목 또는 설명에 완료 표시(`[완료]` 혹은 `[v]`)가 있는지 탐지하여 일정의 완료 유무를 판별합니다.
4. 분석 결과(기한 초과 미완료 일정, 마감 임박 일정 등)를 요약한 리포트 파일을 마크다운(`.md`) 파일로 생성하고, 콘솔 알림 및 요약 정보를 사용자에게 제공하여 누락되는 작업이 없도록 리마인드합니다.

## 2. 사전 준비 및 설정

### Google Calendar API 활성화 및 인증 키 발급
1. [Google Cloud Console](https://console.cloud.google.com/)에 접속하여 새 프로젝트를 생성하거나 기존 프로젝트를 선택합니다.
2. **APIs & Services** > **Library** 메뉴에서 **Google Calendar API**를 검색하여 활성화(Enable)합니다.
3. **APIs & Services** > **OAuth consent screen**으로 이동하여 동의 화면을 구성합니다. (User Type은 External 또는 Internal로 지정 후, 테스트 사용자 이메일에 본인 계정 등록)
4. **APIs & Services** > **Credentials**로 이동하여 **Create Credentials** > **OAuth client ID**를 클릭합니다.
5. Application type을 **Desktop app**으로 선택하고 생성합니다.
6. 생성된 클라이언트를 **Download JSON** 아이콘을 클릭하여 다운로드한 후, 파일 이름을 `credentials.json`으로 변경하여 프로젝트 루트 폴더(`c:\Users\admin\antigravity-workflow\credentials.json`)에 저장합니다.

### 환경 변수 설정 (`.env`)
`.env` 파일에 아래와 같이 설정을 추가합니다:
```env
# Google Calendar 관련 설정
CALENDAR_ID=primary                  # 조회할 구글 캘린더 ID (기본 주소: primary)
REMINDER_LEAD_TIME=30                # 일정 시작/마감 몇 분 전부터 사전 리마인드를 보낼지 설정 (분 단위)
CALENDAR_REPORT_DIR=calendar-reports # 일정 및 리마인드 리포트가 저장될 디렉터리 경로
```

## 3. 실행 방법

### 최초 실행 (인증 획득)
스크립트 최초 실행 시 OAuth 웹 인증이 필요합니다. 아래 명령어로 실행합니다.
```powershell
python execution/google_calendar_reminder.py
```
- 실행 후 브라우저 창이 열리며, 본인의 Google 계정으로 로그인을 진행하고 액세스 권한을 허용해야 합니다.
- 인증이 완료되면 프로젝트 루트에 `token.json` 파일이 생성됩니다. 이 파일이 존재하면 향후 웹 로그인 없이 자동으로 실행됩니다.

### 주기적 리마인드 실행
일정 관리를 자동화하기 위해 매 30분 또는 매 1시간마다 주기적으로 실행하는 것을 권장합니다.

1. **Antigravity `/schedule` 기능 사용**:
   - `/schedule` 명령을 통해 특정 간격(예: 30분)마다 `execution/google_calendar_reminder.py`를 실행하도록 등록할 수 있습니다.
2. **Windows 작업 스케줄러 등록**:
   - 백그라운드에서 백스테이지로 상시 감시를 하려면 Windows 작업 스케줄러에 등록하여 스크립트가 지정된 주기마다 실행되도록 설정합니다.

## 4. 출력 및 상태 관리

### 일정 완료 및 기한 상태 분류 규칙
- **완료 판단**: 일정의 **제목(Summary)** 또는 **설명(Description)**에 `[완료]` 또는 `[v]` 텍스트가 있을 경우
- **일정 상태 분류**:
  - `Completed` (완료): 완료 판별 규칙을 만족하는 일정.
  - `Overdue` (미완료 기한 초과): 완료 표시가 없으면서, 일정 종료 시간이 현재 시간 이전인 경우. (⚠️ 리마인드 주요 경고 대상)
  - `In Progress` (진행 중): 완료 표시가 없으면서, 현재 시간이 일정 시작 시간과 종료 시간 사이에 있는 경우.
  - `Scheduled` (진행 대기): 완료 표시가 없으면서, 시작 시간이 현재 시간 이후인 경우.

### 생성 리포트 파일
실행할 때마다 `calendar-reports/` 디렉터리 하위에 마크다운 리포트 파일이 작성됩니다.
- 파일명 형식: `calendar-reports/report_YYYYMMDD_HHMMSS.md`
- 모든 리포트는 윈도우 인코딩 호환성을 위해 `UTF-8 with BOM` 형식으로 생성되어 한글이 정상적으로 출력됩니다.
- 리포트 내용에는 상태별 분류, 기한 초과 일정 및 마감 임박 일정에 대한 리마인드 메시지가 포함됩니다.

## 5. 문제 해결 (Self-annealing & Edge Cases)
- **`credentials.json` 누락**: 스크립트 실행 시 `credentials.json` 파일이 프로젝트 루트에 존재하지 않는 경우, 스크립트는 강제 예외 종료되는 대신 "구글 인증 credentials.json 파일을 루트 디렉토리에 준비해 달라"는 가이드 메시지를 출력하고 우아하게 종료됩니다.
- **오프라인 또는 API 제한**: 네트워크 에러 발생 시 지정된 횟수만큼 재시도 후 에러 로그를 남깁니다.
