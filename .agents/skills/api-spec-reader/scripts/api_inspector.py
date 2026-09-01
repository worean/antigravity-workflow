"""
AntiGravity API Spec & Source Inspector CLI
Docs(/docs/api)와 Backend(/workflow_server/src/modules)의 API 명세 및 구현 소스를 빠르게 검색/조회하는 헬퍼 도구입니다.
"""

import os
import sys
import argparse
import json
import re

# Windows 콘솔 UTF-8 출력 보장
if sys.stdout.encoding and sys.stdout.encoding.lower() != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", ".."))
DOCS_API_DIR = os.path.join(ROOT_DIR, "docs", "api")
SERVER_MODULES_DIR = os.path.join(ROOT_DIR, "workflow_server", "src", "modules")

def to_camel_case(snake_str):
    components = re.split(r'[-_]', snake_str)
    return components[0] + ''.join(x.title() for x in components[1:])

def discover_api_domains():
    """
    docs/api 디렉토리를 동적으로 스캔하여 도메인 맵을 구축합니다.
    - docs/api/*.md (README.md 제외) -> 단일 파일 도메인
    - docs/api/<folder>/ -> 복합 도메인 (README.md 및 하위 *.md 파일들)
    - workflow_server/src/modules/ 내의 해당 모듈 폴더를 자동 매칭
    """
    domain_map = {}
    if not os.path.exists(DOCS_API_DIR):
        return domain_map

    # 1. 서버에 존재하는 모듈 폴더 목록 수집
    server_modules = {}
    if os.path.exists(SERVER_MODULES_DIR):
        for entry in os.listdir(SERVER_MODULES_DIR):
            m_path = os.path.join(SERVER_MODULES_DIR, entry)
            if os.path.isdir(m_path):
                server_modules[entry.lower()] = entry
                server_modules[re.sub(r'[-_]', '', entry.lower())] = entry

    # 2. docs/api 디렉토리 탐색
    for entry in sorted(os.listdir(DOCS_API_DIR)):
        full_path = os.path.join(DOCS_API_DIR, entry)
        if os.path.isdir(full_path):
            domain_name = entry
            sub_files = [f for f in sorted(os.listdir(full_path)) if f.endswith(".md") and f.lower() != "readme.md"]
            
            # 서버 모듈 매칭
            module_name = domain_name
            cand_camel = to_camel_case(domain_name)
            if domain_name.lower() in server_modules:
                module_name = server_modules[domain_name.lower()]
            elif cand_camel.lower() in server_modules:
                module_name = server_modules[cand_camel.lower()]

            domain_map[domain_name] = {
                "doc": f"{domain_name}/README.md" if os.path.exists(os.path.join(full_path, "README.md")) else f"{domain_name}/",
                "module": module_name,
                "is_dir": True,
                "subs": sub_files
            }
        elif os.path.isfile(full_path) and entry.endswith(".md") and entry.lower() != "readme.md":
            domain_name = entry[:-3] # remove .md
            
            # 서버 모듈 매칭
            module_name = domain_name
            cand_camel = to_camel_case(domain_name)
            if domain_name.lower() in server_modules:
                module_name = server_modules[domain_name.lower()]
            elif cand_camel.lower() in server_modules:
                module_name = server_modules[cand_camel.lower()]

            domain_map[domain_name] = {
                "doc": entry,
                "module": module_name,
                "is_dir": False
            }

    return domain_map

def cmd_list(args):
    domain_map = discover_api_domains()
    print("\n==========================================================================")
    print(" 📌 AntiGravity Backend API Domains & Route Hierarchy (Auto-Discovered)")
    print("==========================================================================")
    print(f"{'Domain':<16} | {'Docs Path':<32} | {'Sub-routes'}")
    print("-" * 75)
    for domain, info in sorted(domain_map.items()):
        subs = ", ".join(info.get("subs", [])) if info.get("subs") else "-"
        print(f"{domain:<16} | docs/api/{info['doc']:<23} | {subs}")
    print("==========================================================================\n")

def cmd_get(args):
    domain_map = discover_api_domains()
    raw_input = args.domain.strip()
    
    # 서브 라우트 직접 지정 (예: projects/members) 처리
    sub_doc_target = None
    if "/" in raw_input or "\\" in raw_input:
        parts = re.split(r'[/\\]', raw_input)
        domain = parts[0].lower()
        sub_name = parts[1].lower().replace(".md", "") + ".md"
        sub_doc_target = sub_name
    else:
        domain = raw_input.lower()

    if domain not in domain_map:
        print(f"❌ 도메인 '{domain}'을(를) 찾을 수 없습니다.")
        print(f"현재 발견된 도메인: {', '.join(sorted(domain_map.keys()))}")
        return

    info = domain_map[domain]
    
    if sub_doc_target:
        doc_rel_path = f"{domain}/{sub_doc_target}"
    else:
        doc_rel_path = info["doc"]

    doc_path = os.path.join(DOCS_API_DIR, doc_rel_path)
    module_path = os.path.join(SERVER_MODULES_DIR, info["module"])

    print(f"\n🏷️ [API Domain: {domain.upper()}]")
    print(f"📖 문서 경로: docs/api/{doc_rel_path}")
    print(f"💻 서버 모듈: workflow_server/src/modules/{info['module']}/\n")

    if os.path.exists(doc_path):
        with open(doc_path, "r", encoding="utf-8", errors="ignore") as f:
            content = f.read().lstrip("\ufeff")
            print(f"--- [ API Specification: docs/api/{doc_rel_path} ] ---")
            lines = content.splitlines()
            for line in lines[:40]:
                print(line)
            if len(lines) > 40:
                print(f"\n... (총 {len(lines)}줄, 전체 내용은 docs/api/{doc_rel_path} 참조)")
    else:
        print(f"⚠️ 문서 파일({doc_path})이 존재하지 않습니다.")

    if info.get("subs") and not sub_doc_target:
        print(f"\n📑 추가 서브 라우트 문서:")
        for s in info["subs"]:
            print(f"   - docs/api/{domain}/{s} (조회: python api_inspector.py get {domain}/{s[:-3]})")

    if os.path.exists(module_path):
        routes_file = os.path.join(module_path, f"{info['module']}.routes.ts")
        if os.path.exists(routes_file):
            print(f"\n--- [ Module Routes ({info['module']}.routes.ts) ] ---")
            with open(routes_file, "r", encoding="utf-8", errors="ignore") as f:
                r_lines = f.read().lstrip("\ufeff").splitlines()
                for line in r_lines:
                    if "router." in line or "Router()" in line or "Router = " in line:
                        print("  ", line.strip())

def cmd_search(args):
    query = args.query.lower()
    print(f"\n🔍 API 엔드포인트/키워드 검색: '{query}'")
    print("=" * 60)
    found = 0

    for root, _, files in os.walk(DOCS_API_DIR):
        for file in files:
            if file.endswith(".md"):
                file_path = os.path.join(root, file)
                rel_path = os.path.relpath(file_path, ROOT_DIR)
                with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                    lines = f.read().lstrip("\ufeff").splitlines()
                    for i, line in enumerate(lines, 1):
                        if query in line.lower():
                            print(f"[{rel_path}:{i}] {line.strip()}")
                            found += 1
    if found == 0:
        print("검색 결과가 없습니다.")
    else:
        print(f"\n총 {found}개의 일치 항목을 발견했습니다.\n")

def main():
    parser = argparse.ArgumentParser(description="AntiGravity API Inspector CLI")
    subparsers = parser.add_subparsers(dest="command")

    subparsers.add_parser("list", help="전체 API 도메인 및 라우트 계층 목록")
    
    get_p = subparsers.add_parser("get", help="특정 도메인의 API 명세 및 소스 정보 조회")
    get_p.add_argument("domain", help="도메인 이름 (예: projects, issues, tags, chat 등 또는 projects/members)")

    search_p = subparsers.add_parser("search", help="API 엔드포인트 또는 설명 키워드 검색")
    search_p.add_argument("query", help="검색 키워드")

    args = parser.parse_args()
    if args.command == "list":
        cmd_list(args)
    elif args.command == "get":
        cmd_get(args)
    elif args.command == "search":
        cmd_search(args)
    else:
        parser.print_help()

if __name__ == "__main__":
    main()
