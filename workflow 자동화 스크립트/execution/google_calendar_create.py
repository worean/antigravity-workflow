# -*- coding: utf-8-sig -*-
"""
Google 캘린더 일정 추가 실행 엔진
(Layer 3: Execution - Create)
- UTF-8 with BOM 인코딩을 적용합니다.
"""

import os
import sys
import datetime
import argparse
from googleapiclient.errors import HttpError

# 공통 모듈 임포트
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from calendar_common import get_calendar_service, parse_input_time, handle_api_error, load_calendar_config

def resolve_calendar_id(calendar_id_input, service):
    """입력된 캘린더 ID를 실제 구글 캘린더 ID로 해결합니다.
    summary 이름(예: '직장', '약속')과 일치할 경우 해당 ID로 변환합니다.
    """
    if not calendar_id_input:
        return "primary", "기본 캘린더"
        
    if calendar_id_input.lower() == "primary":
        return "primary", "기본 캘린더"
        
    calendars = load_calendar_config(service)
    for cal in calendars:
        if cal.get("summary") == calendar_id_input or cal.get("id") == calendar_id_input:
            return cal.get("id"), cal.get("summary")
            
    return calendar_id_input, calendar_id_input

def main():
    parser = argparse.ArgumentParser(description="Google Calendar 일정 추가 툴")
    parser.add_argument("--calendar-id", type=str, default="primary",
                        help="대상 캘린더 ID 또는 이름 (기본값: primary)")
    parser.add_argument("--summary", type=str, required=True,
                        help="일정 제목")
    parser.add_argument("--description", type=str,
                        help="일정 설명")
    parser.add_argument("--start", type=str, required=True,
                        help="시작 일시 (예: '2026-06-18T10:00:00')")
    parser.add_argument("--end", type=str, required=True,
                        help="종료 일시 (예: '2026-06-18T11:00:00')")
    parser.add_argument("--yes", action="store_true",
                        help="사용자 확인 입력을 생략하고 즉시 일정을 추가합니다.")
    parser.add_argument("--duplicate-mode", type=str, default="create", choices=["create", "update", "abort"],
                        help="비슷한 이름의 일정이 있을 때 처리 방식 (create: 새로 추가, update: 기존 일정 수정, abort: 취소)")
    
    args = parser.parse_args()
    
    try:
        service = get_calendar_service()
        
        calendar_id, calendar_summary = resolve_calendar_id(args.calendar_id, service)
        start_iso = parse_input_time(args.start)
        end_iso = parse_input_time(args.end)
        
        # 중복/유사 일정 확인 (제안 날짜 전후 7일 범위)
        start_dt_obj = datetime.datetime.fromisoformat(start_iso)
        time_min = (start_dt_obj - datetime.timedelta(days=7)).isoformat()
        time_max = (start_dt_obj + datetime.timedelta(days=7)).isoformat()
        
        try:
            events_result = service.events().list(
                calendarId=calendar_id,
                timeMin=time_min,
                timeMax=time_max,
                singleEvents=True
            ).execute()
            existing_events = events_result.get('items', [])
        except Exception as e:
            existing_events = []
            
        def is_similar(s1, s2):
            if not s1 or not s2:
                return False
            s1, s2 = s1.strip().lower(), s2.strip().lower()
            if s1 in s2 or s2 in s1:
                return True
            s1_clean = s1.replace(" ", "")
            s2_clean = s2.replace(" ", "")
            if s1_clean in s2_clean or s2_clean in s1_clean:
                return True
            words1 = [w for w in s1.split() if len(w) >= 2]
            words2 = [w for w in s2.split() if len(w) >= 2]
            for w in words1:
                if w in s2:
                    return True
            for w in words2:
                if w in s1:
                    return True
            return False
            
        similar_events = [ev for ev in existing_events if is_similar(args.summary, ev.get('summary', ''))]
        
        duplicate_action = "create"  # 기본값
        target_dup_event = None
        
        if similar_events:
            target_dup_event = similar_events[0]
            print(f"\n[알림] 캘린더에 이미 비슷한 이름의 일정이 존재합니다 (최근 14일 범위):")
            for idx, ev in enumerate(similar_events, 1):
                start_raw = ev.get('start', {})
                time_str = start_raw.get('dateTime') or start_raw.get('date', '')
                print(f"  [{idx}] 제목: {ev.get('summary')} (시간: {time_str})")
            print()
            
            if args.yes:
                duplicate_action = args.duplicate_mode
                print(f" -> 비대화형 실행 옵션에 따라 중복 일정 처리 방식을 '{duplicate_action}'로 진행합니다.")
            else:
                try:
                    print(" 이 기존 일정을 어떻게 처리하시겠습니까?")
                    print("  [A] 기존 일정을 새 일정 시간으로 변경 (Update)")
                    print("  [B] 기존 일정을 그대로 두고 새 일정을 추가 (Ignore & Create)")
                    print("  [C] 일정 추가 취소 (Abort)")
                    choice = input(" 선택 (A/B/C): ").strip().upper()
                    
                    if choice == "A":
                        duplicate_action = "update"
                    elif choice == "B":
                        duplicate_action = "create"
                    else:
                        duplicate_action = "abort"
                except EOFError:
                    print(" -> 비대화형 입력 오류로 일정을 추가하지 않고 취소합니다.", file=sys.stderr)
                    sys.exit(1)
                    
        if duplicate_action == "abort":
            print(" -> 일정 추가 작업이 취소되었습니다.")
            sys.exit(0)
            
        elif duplicate_action == "update" and target_dup_event:
            print(f" -> 기존 일정 '{target_dup_event.get('summary')}' (ID: {target_dup_event.get('id')})을 수정합니다...")
            event_body = {
                'summary': args.summary,
                'description': args.description or target_dup_event.get('description', ''),
                'start': {
                    'dateTime': start_iso,
                    'date': None
                },
                'end': {
                    'dateTime': end_iso,
                    'date': None
                }
            }
            updated_event = service.events().patch(
                calendarId=calendar_id,
                eventId=target_dup_event.get('id'),
                body=event_body
            ).execute()
            print("\n✅ 기존 일정 수정 완료!")
            print(f" - 일정 ID: {updated_event.get('id')}")
            print(f" - 링크: {updated_event.get('htmlLink')}")
            sys.exit(0)
            
        # 제안 정보 출력 (새로 추가할 경우)
        print("\n" + "="*50)
        print(" 📅 구글 캘린더 일정 추가 제안")
        print("-"*50)
        print(f"  - 캘린더: {calendar_summary} ({calendar_id})")
        print(f"  - 제목: {args.summary}")
        print(f"  - 시간: {args.start} ~ {args.end}")
        if args.description:
            print(f"  - 설명: {args.description}")
        print("="*50 + "\n")
        
        # 확인 절차
        if not args.yes:
            try:
                confirm = input(" 이 일정을 정말로 추가하시겠습니까? (y/N): ").strip().lower()
                if confirm not in ['y', 'yes']:
                    print(" -> 일정 추가가 사용자에 의해 취소되었습니다.")
                    sys.exit(0)
            except EOFError:
                print(" -> [경고] 비대화형 환경에서 실행되었으나 --yes 플래그가 제공되지 않았습니다. 안전을 위해 추가를 취소합니다.", file=sys.stderr)
                sys.exit(1)
        
        event_body = {
            'summary': args.summary,
            'description': args.description or '',
            'start': {
                'dateTime': start_iso
            },
            'end': {
                'dateTime': end_iso
            }
        }
        
        print(f" -> 일정을 등록하는 중...")
        created_event = service.events().insert(calendarId=calendar_id, body=event_body).execute()
        print("\n✅ 일정 생성 성공!")
        print(f" - 일정 ID: {created_event.get('id')}")
        print(f" - 링크: {created_event.get('htmlLink')}")
        
    except HttpError as error:
        handle_api_error(error)
    except Exception as e:
        print(f"[{datetime.datetime.now()}] 예기치 못한 오류 발생: {e}", file=sys.stderr)

if __name__ == '__main__':
    main()
