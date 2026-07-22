# -*- coding: utf-8-sig -*-
"""
Google 캘린더 일정 수정 및 완료 관리 실행 엔진
(Layer 3: Execution - Update)
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
    """입력된 캘린더 ID를 실제 구글 캘린더 ID로 해결합니다."""
    if not calendar_id_input:
        return "primary"
    if calendar_id_input.lower() == "primary":
        return "primary"
        
    calendars = load_calendar_config(service)
    for cal in calendars:
        if cal.get("summary") == calendar_id_input or cal.get("id") == calendar_id_input:
            return cal.get("id")
            
    return calendar_id_input

def main():
    parser = argparse.ArgumentParser(description="Google Calendar 일정 수정 및 상태 관리 툴")
    parser.add_argument("--calendar-id", type=str, default="primary",
                        help="대상 캘린더 ID 또는 이름 (기본값: primary)")
    parser.add_argument("--event-id", type=str, required=True,
                        help="수정할 일정 ID")
    parser.add_argument("--summary", type=str,
                        help="변경할 일정 제목")
    parser.add_argument("--description", type=str,
                        help="변경할 일정 설명")
    parser.add_argument("--start", type=str,
                        help="변경할 시작 일시 (예: '2026-06-18T10:00:00')")
    parser.add_argument("--end", type=str,
                        help="변경할 종료 일시 (예: '2026-06-18T11:00:00')")
    parser.add_argument("--complete", action="store_true",
                        help="일정을 완료 상태로 변경합니다. (제목 앞머리에 '[완료]' 태그 추가)")
    
    args = parser.parse_args()
    
    try:
        service = get_calendar_service()
        calendar_id = resolve_calendar_id(args.calendar_id, service)
        
        # 1. 기존 일정 가져오기
        print(f" -> 캘린더 '{calendar_id}'에서 일정 '{args.event_id}' 정보를 조회합니다...")
        try:
            event = service.events().get(calendarId=calendar_id, eventId=args.event_id).execute()
        except HttpError as err:
            if err.resp.status == 404:
                print(f"[오류] 일정 ID '{args.event_id}'를 찾을 수 없습니다. 캘린더 ID와 일정 ID를 다시 확인해 주세요.", file=sys.stderr)
                sys.exit(1)
            raise err
            
        # 2. 업데이트용 데이터 빌드
        event_body = {}
        
        # 완료 플래그 처리
        if args.complete:
            current_summary = event.get('summary', '')
            # 이미 완료 태그가 없는 경우에만 추가
            if not (current_summary.startswith("[완료]") or current_summary.startswith("[v]") or current_summary.startswith("[V]")):
                event_body['summary'] = f"[완료] {current_summary}"
                print(f" -> 일정을 완료 상태로 갱신합니다. 제목 변경: '{current_summary}' -> '{event_body['summary']}'")
            else:
                print(" -> 이미 완료 상태로 표시된 일정입니다.")
                
        # 다른 필드 갱신
        if args.summary:
            # 완료 플래그와 겹칠 경우 우선순위 조정
            if args.complete and not (args.summary.startswith("[완료]") or args.summary.startswith("[v]") or args.summary.startswith("[V]")):
                event_body['summary'] = f"[완료] {args.summary}"
            else:
                event_body['summary'] = args.summary
                
        if args.description is not None:
            event_body['description'] = args.description
            
        if args.start:
            event_body['start'] = {
                'dateTime': parse_input_time(args.start),
                'date': None
            }
        if args.end:
            event_body['end'] = {
                'dateTime': parse_input_time(args.end),
                'date': None
            }
            
        if not event_body:
            print("[경고] 변경할 정보가 없습니다. --summary, --description, --start, --end, --complete 중 하나 이상을 입력해 주세요.")
            return
            
        print(f" -> 일정 정보를 업데이트하는 중...")
        updated_event = service.events().patch(
            calendarId=calendar_id,
            eventId=args.event_id,
            body=event_body
        ).execute()
        
        print("\n✅ 일정 수정 성공!")
        print(f" - 일정 ID: {updated_event.get('id')}")
        print(f" - 제목: {updated_event.get('summary')}")
        print(f" - 링크: {updated_event.get('htmlLink')}")
        
    except HttpError as error:
        handle_api_error(error)
    except Exception as e:
        print(f"[{datetime.datetime.now()}] 예기치 못한 오류 발생: {e}", file=sys.stderr)

if __name__ == '__main__':
    main()
