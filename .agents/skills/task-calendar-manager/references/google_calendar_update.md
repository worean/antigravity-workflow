# Google 캘린더 일정 수정 및 완료 관리 지침서 (SOP)

이 지침서는 구글 캘린더의 일정을 수정(Update)하거나 일정 완료 여부 등의 상태를 제어하는 워크플로우의 실행 및 운영 방법을 정의합니다.

## 1. 개요 및 목적
* 등록된 일정의 정보(제목, 설명, 시작/종료 시간)를 수정하거나, 일정을 완료 상태로 갱신하여 리마인더의 지연 경고 대상에서 제외할 수 있도록 지원합니다.

## 2. 매개변수 규격
* 스크립트 경로: `execution/google_calendar_update.py`
* 입력 인수:
  * `--calendar-id`: 대상 캘린더 ID 또는 이름 (기본값: `primary`).
  * `--event-id` (필수): 수정할 일정의 고유 ID.
  * `--summary`: 수정할 일정 제목.
  * `--description`: 수정할 일정 설명.
  * `--start`: 수정할 시작 일시 (예: `YYYY-MM-DDTHH:MM:SS` 형식).
  * `--end`: 수정할 종료 일시 (예: `YYYY-MM-DDTHH:MM:SS` 형식).
  * `--complete`: 일정을 완료 상태로 변경합니다. (기존 일정 제목의 맨 앞에 `[완료]` 문자열을 자동으로 추가합니다.)

## 3. 실행 예시
* **일정 완료 표시로 상태 갱신**:
  ```powershell
  python execution/google_calendar_update.py --calendar-id "직장" --event-id "exampleEventID12345" --complete
  ```
  *(해당 일정의 제목이 "[완료] 기존제목" 으로 변경됩니다.)*

* **일정 시간 변경**:
  ```powershell
  python execution/google_calendar_update.py --calendar-id "직장" --event-id "exampleEventID12345" --start "2026-06-19T16:00:00" --end "2026-06-19T17:00:00"
  ```

## 4. 예외 사항 및 주의
* 존재하지 않는 `--event-id`를 지정할 시 API 에러(404 Not Found)를 출력하고 정상 종료 처리됩니다.
* `--complete` 적용 시 이미 제목에 `[완료]` 혹은 `[v]`, `[V]` 완료 태그가 포함되어 있다면, 추가로 중복 등록하지 않고 그대로 넘어갑니다.
