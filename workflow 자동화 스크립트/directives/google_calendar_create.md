# Google 캘린더 일정 추가 지침서 (SOP)

이 지침서는 구글 캘린더에 새로운 일정을 추가(Create)하는 워크플로우의 실행 및 운영 방법을 정의합니다.

## 1. 개요 및 목적
* 본 모듈은 사용자 또는 AI 에이전트가 지정된 시간과 설명으로 구글 캘린더에 새 일정을 안전하게 등록할 수 있도록 돕습니다.
* 일정 추가 시, 잘못된 등록을 방지하기 위해 사용자 확인을 요청하는 프로세스를 제공합니다.

## 2. 매개변수 규격
* 스크립트 경로: `execution/google_calendar_create.py`
* 입력 인수:
  * `--calendar-id`: 일정 추가 대상 캘린더 ID 또는 캘린더 이름 (예: `primary`, `직장`, `약속`).
  * `--summary` (필수): 일정의 제목.
  * `--description`: 일정의 상세 설명.
  * `--start` (필수): 시작 날짜 및 시각 (예: `YYYY-MM-DDTHH:MM:SS` 형식).
  * `--end` (필수): 종료 날짜 및 시각 (예: `YYYY-MM-DDTHH:MM:SS` 형식).
  * `--yes`: 대화형 확인 절차(Y/N 입력)를 생략하고 즉시 일정을 생성합니다. (AI 자동화에 필수)
  * `--duplicate-mode`: 비슷한 이름의 기존 일정이 발견되었을 때의 기본 처리 방법 (`create`: 무시하고 새 일정 추가, `update`: 기존 일정의 시간/설명 수정, `abort`: 취소. 기본값: `create`).

## 3. 중복/유사 일정 확인 및 승인 흐름
등록하려는 일정의 제목과 비슷한 기존 일정이 등록 날짜 전후 7일(총 14일) 범위 내에 존재하는지 검사합니다.

1. **대화형 실행 시**:
   * 비슷한 일정이 감지되면 목록을 출력한 후 사용자에게 선택을 요청합니다:
     ```text
     [A] 기존 일정을 새 일정 시간으로 변경 (Update)
     [B] 기존 일정을 그대로 두고 새 일정을 추가 (Ignore & Create)
     [C] 일정 추가 취소 (Abort)
     ```
   * 선택에 따라 기존 일정이 수정되거나, 새 일정이 추가되거나, 작업이 취소됩니다.
2. **비대화형/자동화 실행 시 (`--yes` 지정)**:
   * `--duplicate-mode`로 설정된 값에 따라 무인으로 작동합니다. (기존 일정을 덮어쓰고 수정하려면 `--duplicate-mode update` 지정)

## 4. 실행 예시
* **일반 실행 (대화형 확인)**:
  ```powershell
  python execution/google_calendar_create.py --calendar-id "직장" --summary "SW개발파트 회의" --start "2026-06-19T15:00:00" --end "2026-06-19T16:00:00"
  ```

* **중복 발생 시 덮어쓰기 자동화 실행**:
  ```powershell
  python execution/google_calendar_create.py --calendar-id "직장" --summary "SW개발파트 회의" --start "2026-06-19T15:00:00" --end "2026-06-19T16:00:00" --yes --duplicate-mode update
  ```

## 5. 예외 사항 및 주의
* 시간 형식이 맞지 않는 경우 오류 메시지와 함께 종료됩니다.
* 종일(All-day) 일정을 일반 일정(Time-based)으로 업데이트(Update)할 때는 기존의 `date` 값을 자동으로 제거하여 API 충돌을 예방합니다.
* 캘린더 이름을 한국어로 넣을 경우, [calendar_config.json](file:///c:/Users/admin/antigravity-workflow/calendar_config.json)의 `summary` 값과 일치해야 ID를 정상적으로 해석하여 등록합니다. 일치하는 이름이 없을 시 에러 없이 입력된 문자열을 직접 ID로 판단하여 API에 보냅니다.
