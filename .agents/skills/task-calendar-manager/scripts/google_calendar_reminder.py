# -*- coding: utf-8-sig -*-
"""
Google 캘린더 오늘 일정 수집 및 기한 기반 리마인드 스크립트
(Layer 3: Execution)
- UTF-8 with BOM 인코딩을 적용합니다.
"""

import os
import sys
import datetime
import json
import argparse
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError

# UTF-8 출력 강제 설정 (윈도우 콘솔 한글 깨짐 방지)
try:
    sys.stdout.reconfigure(encoding='utf-8')
    sys.stderr.reconfigure(encoding='utf-8')
except AttributeError:
    pass

# 읽기 및 쓰기가 포함된 캘린더 전체 권한 범위
SCOPES = ['https://www.googleapis.com/auth/calendar']

def load_env(env_path=".env"):
    """.env 파일에서 환경 변수를 수동으로 로드합니다."""
    if os.path.exists(env_path):
        try:
            with open(env_path, "r", encoding="utf-8-sig") as f:
                for line in f:
                    line = line.strip()
                    if not line or line.startswith("#"):
                        continue
                    if "=" in line:
                        key, val = line.split("=", 1)
                        os.environ[key.strip()] = val.strip()
        except Exception as e:
            print(f"[{datetime.datetime.now()}] .env 파일 로드 중 오류 발생: {e}", file=sys.stderr)

def get_calendar_service():
    """구글 Calendar API 인증을 완료하고 서비스 객체를 반환합니다."""
    creds = None
    # 이전에 발급받은 토큰이 있으면 로드
    if os.path.exists('token.json'):
        try:
            creds = Credentials.from_authorized_user_file('token.json', SCOPES)
        except Exception as e:
            print(f"[{datetime.datetime.now()}] 기존 token.json 파일 로드 중 오류 발생: {e}. 재인증을 시도합니다.", file=sys.stderr)

    # 유효한 자격 증명이 없으면 사용자 로그인 유도
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            try:
                creds.refresh(Request())
            except Exception as e:
                print(f"[{datetime.datetime.now()}] 토큰 갱신 중 오류 발생: {e}. 새로운 인증 흐름을 시작합니다.", file=sys.stderr)
                creds = None

        if not creds:
            if not os.path.exists('credentials.json'):
                print("\n" + "="*80, file=sys.stderr)
                print(" [오류] 'credentials.json' 파일을 찾을 수 없습니다.", file=sys.stderr)
                print(" Google Cloud Console에서 OAuth 클라이언트 ID(데스크톱 앱)를 생성하고", file=sys.stderr)
                print(" 다운로드한 파일을 프로젝트 루트 디렉터리에 'credentials.json'으로 복사해 주세요.", file=sys.stderr)
                print(" 상세 가이드는 'directives/google_calendar_reminder.md'를 참고해 주시기 바랍니다.", file=sys.stderr)
                print("="*80 + "\n", file=sys.stderr)
                sys.exit(1)
            
            try:
                flow = InstalledAppFlow.from_client_secrets_file('credentials.json', SCOPES)
                creds = flow.run_local_server(port=0)
                # 다음 인증을 위해 토큰 저장
                with open('token.json', 'w', encoding='utf-8') as token:
                    token.write(creds.to_json())
            except Exception as e:
                print(f"[{datetime.datetime.now()}] 구글 인증 흐름 진행 중 오류 발생: {e}", file=sys.stderr)
                sys.exit(1)
                
    return build('calendar', 'v3', credentials=creds)

def load_calendar_config(service):
    """
    calendar_config.json 파일에서 모니터링할 캘린더 설정을 로드합니다.
    파일이 없으면 구글 Calendar List API를 조회하여 새로 생성합니다.
    """
    config_path = 'calendar_config.json'
    
    if os.path.exists(config_path):
        try:
            with open(config_path, 'r', encoding='utf-8-sig') as f:
                config_data = json.load(f)
            configs = config_data.get("managed_calendars", [])
            if configs:
                enabled = [c for c in configs if c.get("enabled", True)]
                if enabled:
                    return enabled
                else:
                    print(f"[{datetime.datetime.now()}] 경고: calendar_config.json에 활성화(enabled=true)된 캘린더가 없습니다.", file=sys.stderr)
        except Exception as e:
            print(f"[{datetime.datetime.now()}] calendar_config.json 로드 중 오류 발생: {e}. 구글 API로부터 목록을 갱신합니다.", file=sys.stderr)
            
    try:
        print(f"[{datetime.datetime.now()}] 구글 계정에서 캘린더 목록을 조회하여 새로운 '{config_path}' 파일을 생성합니다...")
        calendar_list_result = service.calendarList().list().execute()
        calendar_items = calendar_list_result.get('items', [])
        
        configs = []
        for item in calendar_items:
            summary = item.get('summaryOverride') or item.get('summary') or item.get('id')
            configs.append({
                "id": item.get('id'),
                "summary": summary,
                "description": item.get('description', ''),
                "enabled": True
            })
            
        config_data = {
            "managed_calendars": configs
        }
        
        with open(config_path, 'w', encoding='utf-8-sig') as f:
            json.dump(config_data, f, ensure_ascii=False, indent=2)
            
        print(f"[{datetime.datetime.now()}] '{config_path}' 파일이 생성되었습니다. 감시를 원치 않는 캘린더는 'enabled': false 로 설정해 주세요.")
        return [c for c in configs if c["enabled"]]
    except Exception as e:
        print(f"[{datetime.datetime.now()}] 캘린더 목록을 구글 API로부터 조회하는 중 오류 발생: {e}", file=sys.stderr)
        return [{"id": "primary", "summary": "기본 캘린더", "enabled": True}]

def parse_event_time(time_dict):
    """구글 캘린더 API의 시간 딕셔너리를 시스템 타임존이 반영된 tz-aware datetime 객체로 파싱합니다."""
    if 'dateTime' in time_dict:
        # 일반 일정 (시간 있음)
        return datetime.datetime.fromisoformat(time_dict['dateTime'])
    elif 'date' in time_dict:
        # 종일 일정
        date_str = time_dict['date']
        dt = datetime.datetime.strptime(date_str, "%Y-%m-%d")
        return dt.astimezone()  # 시스템 로컬 타임존 적용
    return None

def check_completed(summary, description):
    """일정의 완료 여부를 판단합니다. ([완료] 또는 [v] 태그 탐지)"""
    text = f"{summary or ''} {description or ''}"
    patterns = ["[완료]", "[v]", "[V]"]
    for pattern in patterns:
        if pattern in text:
            return True
    return False

def format_timedelta(td):
    """timedelta 객체를 가독성 좋은 'H시간 M분' 형태로 포맷팅합니다."""
    total_seconds = int(td.total_seconds())
    hours = total_seconds // 3600
    minutes = (total_seconds % 3600) // 60
    if hours > 0:
        return f"{hours}시간 {minutes}분"
    return f"{minutes}분"

def generate_report(events, now, lead_time_minutes, report_dir, enabled_calendars):
    """분석 결과를 토대로 마크다운 리포트를 작성하고 저장합니다."""
    os.makedirs(report_dir, exist_ok=True)
    report_filename = f"report_{now.strftime('%Y%m%d_%H%M%S')}.md"
    report_path = os.path.join(report_dir, report_filename)
    
    # 상태별 분류용 리스트
    completed_list = []
    overdue_list = []
    in_progress_list = []
    scheduled_list = []
    
    for event in events:
        summary = event.get('summary', '(제목 없음)')
        description = event.get('description', '')
        start_raw = event.get('start', {})
        end_raw = event.get('end', {})
        
        start_dt = parse_event_time(start_raw)
        end_dt = parse_event_time(end_raw)
        
        is_all_day = 'date' in start_raw
        is_completed = check_completed(summary, description)
        
        # 일정 정보 객체
        event_info = {
            'id': event.get('id'),
            'summary': summary,
            'description': description,
            'start': start_dt,
            'end': end_dt,
            'is_all_day': is_all_day,
            'is_completed': is_completed,
            'htmlLink': event.get('htmlLink', ''),
            'calendar_name': event.get('calendar_name', '알 수 없음')
        }
        
        if is_completed:
            completed_list.append(event_info)
        elif end_dt and end_dt <= now:
            overdue_list.append(event_info)
        elif start_dt and start_dt <= now < end_dt:
            in_progress_list.append(event_info)
        else:
            scheduled_list.append(event_info)
            
    # 마크다운 내용 생성
    report_content = []
    report_content.append(f"# 📅 Google 캘린더 오늘 일정 및 리마인드 리포트")
    report_content.append(f"- **기준 일시**: {now.strftime('%Y-%m-%d %H:%M:%S')}")
    report_content.append(f"- **설정된 알림 기준 시간**: {lead_time_minutes}분 전")
    
    # 모니터링 대상 캘린더 리스트 표시
    report_content.append("\n### 📂 모니터링 대상 캘린더")
    for cal in enabled_calendars:
        report_content.append(f"- {cal['summary']} (`{cal['id']}`)")
        
    report_content.append("\n## 📊 일정 요약")
    report_content.append(f"- ⚠️ **미완료 기한 초과 (Overdue)**: {len(overdue_list)}건")
    report_content.append(f"- ⏰ **진행 중 (In Progress)**: {len(in_progress_list)}건")
    report_content.append(f"- 📅 **진행 대기 (Scheduled)**: {len(scheduled_list)}건")
    report_content.append(f"- ✅ **완료됨 (Completed)**: {len(completed_list)}건")
    report_content.append(f"- **총 일정**: {len(events)}건")
    report_content.append("\n" + "="*40 + "\n")
    
    # 1. 미완료 기한 초과 일정 (⚠️ Overdue)
    report_content.append("## ⚠️ 미완료 기한 초과 일정 (Overdue)")
    if overdue_list:
        for ev in overdue_list:
            time_str = "종일 일정" if ev['is_all_day'] else f"{ev['start'].strftime('%H:%M')} ~ {ev['end'].strftime('%H:%M')}"
            overdue_duration = now - ev['end']
            report_content.append(f"### 🛑 {ev['summary']}")
            report_content.append(f"- **캘린더**: {ev['calendar_name']}")
            report_content.append(f"- **시간**: {time_str}")
            report_content.append(f"- **상태**: ⚠️ 마감 기한 지남 (지연 시간: **{format_timedelta(overdue_duration)}**)")
            if ev['description']:
                report_content.append(f"- **설명**: {ev['description']}")
            report_content.append(f"- [구글 캘린더에서 보기]({ev['htmlLink']})")
            report_content.append("")
    else:
        report_content.append("*기한이 지난 미완료 일정이 없습니다. 아주 좋습니다!*\n")
        
    # 2. 진행 중인 미완료 일정 (⏰ In Progress)
    report_content.append("## ⏰ 진행 중인 미완료 일정 (In Progress)")
    if in_progress_list:
        for ev in in_progress_list:
            time_str = "종일 일정" if ev['is_all_day'] else f"{ev['start'].strftime('%H:%M')} ~ {ev['end'].strftime('%H:%M')}"
            remaining_time = ev['end'] - now
            report_content.append(f"### ⚡ {ev['summary']}")
            report_content.append(f"- **캘린더**: {ev['calendar_name']}")
            report_content.append(f"- **시간**: {time_str}")
            report_content.append(f"- **상태**: 진행 중 (마감까지 **{format_timedelta(remaining_time)}** 남음)")
            if ev['description']:
                report_content.append(f"- **설명**: {ev['description']}")
            report_content.append(f"- [구글 캘린더에서 보기]({ev['htmlLink']})")
            report_content.append("")
    else:
        report_content.append("*현재 진행 중인 미완료 일정이 없습니다.*\n")

    # 3. 진행 대기 중인 일정 (📅 Scheduled)
    report_content.append("## 📅 진행 대기 중인 일정 (Scheduled)")
    if scheduled_list:
        for ev in scheduled_list:
            time_str = "종일 일정" if ev['is_all_day'] else f"{ev['start'].strftime('%H:%M')} ~ {ev['end'].strftime('%H:%M')}"
            time_to_start = ev['start'] - now
            
            # 곧 시작할 일정 리마인드 여부
            lead_time = datetime.timedelta(minutes=lead_time_minutes)
            is_soon = time_to_start <= lead_time and not ev['is_all_day']
            soon_tag = " [🔔 시작 임박!]" if is_soon else ""
            
            report_content.append(f"### ⏳ {ev['summary']}{soon_tag}")
            report_content.append(f"- **캘린더**: {ev['calendar_name']}")
            report_content.append(f"- **시간**: {time_str}")
            if ev['is_all_day']:
                report_content.append(f"- **상태**: 오늘 예정됨 (종일)")
            else:
                report_content.append(f"- **상태**: 대기 중 (시작까지 **{format_timedelta(time_to_start)}** 남음)")
            if ev['description']:
                report_content.append(f"- **설명**: {ev['description']}")
            report_content.append(f"- [구글 캘린더에서 보기]({ev['htmlLink']})")
            report_content.append("")
    else:
        report_content.append("*오늘 예정된 대기 일정이 없습니다.*\n")

    # 4. 완료된 일정 (✅ Completed)
    report_content.append("## ✅ 완료된 일정 (Completed)")
    if completed_list:
        for ev in completed_list:
            time_str = "종일 일정" if ev['is_all_day'] else f"{ev['start'].strftime('%H:%M')} ~ {ev['end'].strftime('%H:%M')}"
            report_content.append(f"###  {ev['summary']}")
            report_content.append(f"- **캘린더**: {ev['calendar_name']}")
            report_content.append(f"- **시간**: {time_str}")
            report_content.append(f"- **상태**: 완료")
            if ev['description']:
                report_content.append(f"- **설명**: {ev['description']}")
            report_content.append(f"- [구글 캘린더에서 보기]({ev['htmlLink']})")
            report_content.append("")
    else:
        report_content.append("*오늘 완료 표시된 일정이 없습니다. 완료된 일정에는 [완료] 혹은 [v] 태그를 붙여주세요.*\n")

    # 파일에 저장 (UTF-8 with BOM)
    with open(report_path, "w", encoding="utf-8-sig") as f:
        f.write("\n".join(report_content))
        
    return report_path, overdue_list, in_progress_list, scheduled_list, completed_list

def main():
    # 환경 변수 로드
    load_env()
    
    # 아규먼트 파서 설정
    parser = argparse.ArgumentParser(description="Google Calendar 오늘 일정 기한 분석 및 리마인드 툴")
    parser.add_argument("--calendar-id", type=str, help="캘린더 ID (기본값: calendar_config.json 설정 반영)")
    parser.add_argument("--lead-time", type=int, help="리마인드 사전 경고 시간(분 단위)")
    parser.add_argument("--report-dir", type=str, help="리포트 파일 저장 폴더")
    
    args = parser.parse_args()
    
    # 설정 우선순위: 1) 파라미터, 2) 환경변수, 3) 기본값
    cli_calendar_id = args.calendar_id
    
    try:
        lead_time_minutes = int(args.lead_time or os.environ.get("REMINDER_LEAD_TIME", 30))
    except ValueError:
        lead_time_minutes = 30
        
    report_dir = args.report_dir or os.environ.get("CALENDAR_REPORT_DIR", "calendar-reports")
    
    now = datetime.datetime.now().astimezone()
    print("=" * 60)
    print(" 📅 Google Calendar 일정 리마인드 모니터링 시작")
    print("-" * 60)
    print(f" 현재 시간: {now.strftime('%Y-%m-%d %H:%M:%S')}")
    if cli_calendar_id:
        print(f" 모니터링 대상 (CLI): {cli_calendar_id}")
    else:
        print(f" 모니터링 대상: calendar_config.json 설정 반영")
    print(f" 시작 경고 임계시간: 시작 {lead_time_minutes}분 전")
    print("=" * 60)
    
    try:
        service = get_calendar_service()
        
        if cli_calendar_id:
            enabled_calendars = [{"id": cli_calendar_id, "summary": cli_calendar_id, "enabled": True}]
        else:
            enabled_calendars = load_calendar_config(service)
            
        print(f" -> 총 {len(enabled_calendars)}개의 활성화된 캘린더를 감시합니다.")
        for cal in enabled_calendars:
            print(f"    - {cal['summary']} ({cal['id']})")
        
        # 오늘 하루의 시간 범위 계산 (00:00:00 ~ 23:59:59)
        local_today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        local_today_end = now.replace(hour=23, minute=59, second=59, microsecond=999999)
        
        # ISO 8601 포맷 문자열 생성
        time_min = local_today_start.isoformat()
        time_max = local_today_end.isoformat()
        
        # 복수 캘린더 일정 조회
        events = []
        for cal in enabled_calendars:
            cal_id = cal["id"]
            cal_summary = cal["summary"]
            
            try:
                events_result = service.events().list(
                    calendarId=cal_id, 
                    timeMin=time_min, 
                    timeMax=time_max, 
                    singleEvents=True, 
                    orderBy='startTime'
                ).execute()
                
                cal_events = events_result.get('items', [])
                for item in cal_events:
                    item['calendar_name'] = cal_summary
                events.extend(cal_events)
                print(f"    [OK] '{cal_summary}': {len(cal_events)}개의 일정을 로드했습니다.")
            except HttpError as error:
                print(f"    [ERR] '{cal_summary}' 캘린더 조회 중 오류 발생: {error}", file=sys.stderr)
            except Exception as e:
                print(f"    [ERR] '{cal_summary}' 캘린더 예기치 못한 오류 발생: {e}", file=sys.stderr)
        
        # 시작 시간 기준으로 전체 일정 정렬
        def get_event_start_time(ev):
            start_raw = ev.get('start', {})
            dt = parse_event_time(start_raw)
            return dt if dt else datetime.datetime.max.astimezone()
            
        events.sort(key=get_event_start_time)
        
        if not events:
            print(f" -> 오늘({local_today_start.strftime('%Y-%m-%d')}) 예정된 일정이 캘린더에 존재하지 않습니다.")
            return
            
        print(f" -> 총 {len(events)}개의 일정을 로드했습니다. 상태 분석을 시작합니다...")
        
        report_path, overdue, in_progress, scheduled, completed = generate_report(
            events, now, lead_time_minutes, report_dir, enabled_calendars
        )
        
        # CLI 요약 출력 및 리마인드 통보
        print("\n" + "-"*50)
        print(f" 📊 분석 결과 요약 (보고서 생성: {os.path.basename(report_path)})")
        print("-" * 50)
        print(f"  🛑 기한 지남 (Overdue): {len(overdue)}건")
        print(f"  ⚡ 진행 중 (In Progress): {len(in_progress)}건")
        print(f"  ⏳ 진행 대기 (Scheduled): {len(scheduled)}건")
        print(f"  ✅ 완료된 일정 (Completed): {len(completed)}건")
        print("-" * 50)
        
        # 알림 출력
        has_reminders = False
        
        # 1. 지연 경고 알림
        if overdue:
            has_reminders = True
            print("\n [⚠️ 기한 초과 경고]")
            for ev in overdue:
                time_str = "종일" if ev['is_all_day'] else ev['end'].strftime('%H:%M')
                overdue_duration = now - ev['end']
                print(f"  - 🛑 {ev['summary']} (캘린더: {ev['calendar_name']} / 마감: {time_str} / 지연시간: {format_timedelta(overdue_duration)})")
                
        # 2. 곧 시작하거나 진행 중인 중요 리마인드
        lead_time = datetime.timedelta(minutes=lead_time_minutes)
        soon_events = []
        for ev in scheduled:
            if not ev['is_all_day'] and (ev['start'] - now) <= lead_time:
                soon_events.append(ev)
                
        if in_progress or soon_events:
            has_reminders = True
            print("\n [⏰ 일정 리마인드]")
            for ev in in_progress:
                rem_time = ev['end'] - now
                print(f"  - ⚡ [진행중] {ev['summary']} (캘린더: {ev['calendar_name']} / 종료까지 {format_timedelta(rem_time)} 남음)")
            for ev in soon_events:
                start_in = ev['start'] - now
                print(f"  - 🔔 [곧시작] {ev['summary']} (캘린더: {ev['calendar_name']} / {format_timedelta(start_in)} 후 시작)")
                
        if not has_reminders:
            print("\n  🎉 리마인드가 필요한 긴급한 일정이 없습니다. 훌륭합니다!")
            
        print("\n" + "=" * 60)
        print(" 📅 모니터링 분석 완료")
        print("=" * 60)
        
    except HttpError as error:
        print(f"[{datetime.datetime.now()}] Google Calendar API 호출 중 오류 발생: {error}", file=sys.stderr)
    except Exception as e:
        print(f"[{datetime.datetime.now()}] 예기치 못한 오류 발생: {e}", file=sys.stderr)

if __name__ == '__main__':
    main()
