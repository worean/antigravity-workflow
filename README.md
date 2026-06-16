# 🚀 Antigravity 자동화 워크플로우 시스템

이 프로젝트는 루리웹 RSS 피드 키워드 수집기와 Google Calendar 일정을 기한에 맞춰 감시하고 리마인드를 전송하는 3-Layer Architecture 기반의 자동화 워크플로우 모음입니다.

모든 소스 코드와 문서 파일은 한글 호환성을 위해 **UTF-8 with BOM** 인코딩을 준수하여 작성되었습니다.

---

## 📂 프로젝트 구성

```text
antigravity-workflow/
│
├── directives/                        # Layer 1: 표준 운영 지침서 (SOP)
│   ├── collect_ruliweb_rss.md         # 루리웹 수집기 SOP 지침
│   └── google_calendar_reminder.md    # 구글 캘린더 리마인드 SOP 지침
│
├── execution/                         # Layer 3: 실행 스크립트
│   ├── collect_ruliweb_rss.py         # 루리웹 수집기 파이썬 엔진
│   └── google_calendar_reminder.py    # 구글 캘린더 리마인드 파이썬 엔진
│
├── .env                               # 환경 설정 파일
├── run_ruliweb_collector.sh           # 루리웹 수집기 실행 쉘 스크립트
└── README.md                          # 본 시스템 안내 문서
```

---

## 🛠️ 사전 준비 사항

### 1. 의존성 라이브러리 설치
터미널 또는 PowerShell을 열어 필요한 외부 라이브러리들을 설치해 주십시오.

```powershell
# 루리웹 수집기용 의존성
pip install requests beautifulsoup4

# 구글 캘린더 리마인드용 의존성
pip install google-api-python-client google-auth-oauthlib google-auth-httplib2
```

### 2. 환경 변수 구성 (`.env`)
프로젝트 루트 폴더에 `.env` 파일을 만들고 아래 내용을 맞추어 구성합니다:

```env
# ==========================================
# 1. 루리웹 RSS 수집기 설정
# ==========================================
# 수집 대상 키워드 (쉼표로 구분)
RSS_KEYWORDS=후방,후방주의,ㅎㅂ
# 감시 주기 (초 단위, 기본 300초 = 5분)
RSS_INTERVAL=300
# 작동 시간 (시간 단위, 기본 24시간)
RSS_DURATION=24
# 메타데이터 누적 저장 파일
RSS_OUTPUT_PATH=collected_posts.csv
# 마크다운 리포트 저장 폴더
RSS_ANALYSIS_DIR=ruli-analysis
# 베스트 댓글로 수집할 추천수 기준
RSS_LIKE_THRESHOLD=5

# ==========================================
# 2. Google Calendar 리마인더 설정
# ==========================================
# 조회할 구글 캘린더 ID
CALENDAR_ID=primary
# 알림 경고 기준 시간 (분)
REMINDER_LEAD_TIME=30
# 리마인드 보고서 저장 폴더
CALENDAR_REPORT_DIR=calendar-reports
```

---

## 🚀 실행 가이드

### 1. 루리웹 RSS 수집기 실행

#### Option A: 쉘 스크립트 사용 (Git Bash, WSL, Linux 등)
루트 디렉터리에 포함된 `.sh` 스크립트를 사용하여 간단하게 구동할 수 있습니다.
```bash
# 실행 권한 부여 (필요 시)
chmod +x run_ruliweb_collector.sh

# 실행
./run_ruliweb_collector.sh
```

#### Option B: Windows PowerShell (백그라운드 실행)
윈도우 환경에서 터미널을 끄더라도 24시간 동안 백그라운드에서 상시 작동하도록 실행하려면 아래 명령을 사용합니다:
```powershell
Start-Process python -ArgumentList "execution/collect_ruliweb_rss.py" -WindowStyle Hidden
```

#### Option C: 일반 실행 (포그라운드)
```powershell
python execution/collect_ruliweb_rss.py
```

---

### 2. Google 캘린더 리마인더 실행

구글 캘린더 연동을 위해서는 구글 API 콘솔에서 `credentials.json`을 발급받아 루트 디렉터리에 저장해야 합니다. 상세한 준비 과정은 [google_calendar_reminder.md](file:///c:/Users/admin/antigravity-workflow/directives/google_calendar_reminder.md) 지침서를 확인해 주세요.

#### 최초 실행 (웹 인증 진행)
```powershell
python execution/google_calendar_reminder.py
```
* 최초 실행 시 웹 브라우저가 열리며 Google 계정 로그인을 요청합니다. 권한 승인이 완료되면 `token.json`이 생성되고 이후부터는 무인으로 자동 실행됩니다.

#### 주기적 감시 등록
캘린더 내용 분석 및 기한 체크를 자동화하기 위해, 윈도우 작업 스케줄러 등을 사용하여 본 스크립트가 주기적으로(예: 30분 간격) 실행되도록 등록하여 사용하시는 것을 권장합니다.

---

## 📊 결과물 확인
- **루리웹 수집 글 목록**: `collected_posts.csv`에 누적 기록되며, 상세 이미지 및 글별 분석은 `ruli-analysis/` 폴더 하위 마크다운 리포트로 저장됩니다.
- **구글 캘린더 리마인드**: 실행 시점마다 `calendar-reports/` 폴더 아래에 일일 일정 현황 및 지연/임박 경고 리포트가 작성됩니다.
