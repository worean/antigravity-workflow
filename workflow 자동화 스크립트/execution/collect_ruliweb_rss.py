import os
import sys
import time
import datetime
import json
import csv
import xml.etree.ElementTree as ET
import argparse
import re
import requests
from bs4 import BeautifulSoup

RSS_URL = "https://bbs.ruliweb.com/community/board/300143/rss"

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

def save_state(state_path, seen_links):
    """중복 수집 방지를 위해 수집된 링크 상태를 저장합니다."""
    try:
        os.makedirs(os.path.dirname(state_path), exist_ok=True)
        with open(state_path, "w", encoding="utf-8-sig") as f:
            json.dump(list(seen_links), f, ensure_ascii=False, indent=2)
    except Exception as e:
        print(f"[{datetime.datetime.now()}] 상태 파일 저장 중 오류 발생: {e}", file=sys.stderr)

def load_state(state_path):
    """수집된 링크 상태를 로드합니다."""
    if os.path.exists(state_path):
        try:
            with open(state_path, "r", encoding="utf-8-sig") as f:
                return set(json.load(f))
        except Exception as e:
            print(f"[{datetime.datetime.now()}] 상태 파일 로드 중 오류 발생: {e}. 새 상태로 시작합니다.", file=sys.stderr)
    return set()

def scrape_post_and_comments(url, like_threshold=5):
    """게시글 URL에서 본문, 이미지 링크, 추천수 조건에 부합하는 베스트 댓글을 파싱하여 반환합니다."""
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    }
    
    content_text = ""
    best_comments = []
    image_urls = []
    
    try:
        response = requests.get(url, headers=headers, timeout=12)
        if response.status_code != 200:
            print(f" -> [상세 페이지 접근 실패] HTTP {response.status_code} - URL: {url}", file=sys.stderr)
            return "", [], []
            
        response.encoding = "utf-8"
        soup = BeautifulSoup(response.content, "html.parser")
        
        # 1. 본문 추출 및 이미지 링크 추출
        view_content = soup.find(class_="view_content")
        if view_content:
            # 이미지 링크 수집
            img_tags = view_content.find_all("img")
            for img in img_tags:
                src = img.get("src")
                if src:
                    # 프로토콜 미지정 주소 보완
                    if src.startswith("//"):
                        src = "https:" + src
                    elif src.startswith("/"):
                        src = "https://bbs.ruliweb.com" + src
                    # 중복 제외하고 수집
                    if src not in image_urls:
                        image_urls.append(src)
            
            # 텍스트 추출을 위해 불필요 태그 정리
            for s in view_content(["script", "style"]):
                s.decompose()
            content_text = view_content.get_text("\n", strip=True)
            
        # 2. 댓글 및 추천수 파싱
        comment_elements = soup.find_all(class_="comment_element")
        for el in comment_elements:
            nick_el = el.find(class_="nick_link")
            if nick_el:
                author = nick_el.get_text(strip=True)
            else:
                nick_el = el.find(class_="nick")
                author = nick_el.get_text(strip=True) if nick_el else "알수없음"
                
            btn_like = el.find(class_="btn_like")
            if btn_like:
                num_el = btn_like.find(class_="num")
                likes = int(num_el.get_text(strip=True)) if num_el else 0
            else:
                likes = 0
                
            text_el = el.find(class_="text")
            text = text_el.get_text(strip=True) if text_el else ""
            
            if likes >= like_threshold:
                best_comments.append({
                    "author": author,
                    "likes": likes,
                    "text": text
                })
                
    except Exception as e:
        print(f" -> [파싱 중 오류 발생] URL: {url}, 오류: {e}", file=sys.stderr)
        
    return content_text, best_comments, image_urls

def download_images(image_urls, analysis_dir, filename_prefix):
    """이미지 URL 목록의 파일들을 다운로드하여 리포트와 같은 폴더에 jpg 파일명으로 저장합니다."""
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Referer": "https://bbs.ruliweb.com/"
    }
    
    downloaded_count = 0
    for i, url in enumerate(image_urls, 1):
        try:
            r = requests.get(url, headers=headers, timeout=15)
            if r.status_code == 200:
                # 이미지가 1개면 접미사 없이, 여러개면 _1, _2 형태로 저장
                if len(image_urls) == 1:
                    filename = f"{filename_prefix}.jpg"
                else:
                    filename = f"{filename_prefix}_{i}.jpg"
                    
                filepath = os.path.join(analysis_dir, filename)
                with open(filepath, "wb") as f:
                    f.write(r.content)
                print(f"   -> [이미지 저장 완료] {filename}")
                downloaded_count += 1
        except Exception as e:
            print(f"   -> [이미지 다운로드 실패] URL: {url}, 오류: {e}", file=sys.stderr)
    return downloaded_count

def save_post_report(analysis_dir, filename_prefix, title, link, category, author, pub_date, content_text, best_comments, like_threshold, image_urls):
    """추출된 본문, 이미지 목록, 베스트 댓글 목록을 마크다운 보고서로 작성하여 저장합니다."""
    try:
        os.makedirs(analysis_dir, exist_ok=True)
        filepath = os.path.join(analysis_dir, f"{filename_prefix}.md")
        
        # 베스트 댓글 섹션 구성
        comments_section = ""
        if best_comments:
            for i, comment in enumerate(best_comments, 1):
                comments_section += f"### {i}. {comment['author']} (추천수: {comment['likes']})\n"
                comments_section += f"{comment['text']}\n\n"
        else:
            comments_section = f"*추천수 {like_threshold}개 이상의 베스트 댓글이 존재하지 않습니다.*\n"
            
        # 다운로드된 이미지 리스트 및 마크다운 렌더링 섹션 구성
        images_section = ""
        if image_urls:
            images_section += "## 🖼️ 첨부 이미지 목록\n"
            for i in range(1, len(image_urls) + 1):
                img_filename = f"{filename_prefix}.jpg" if len(image_urls) == 1 else f"{filename_prefix}_{i}.jpg"
                images_section += f"- **이미지 {i}**: `[로컬 저장] {img_filename}`\n"
                # 마크다운 렌더링용 태그 추가 (상대경로 참조)
                images_section += f"  ![첨부 이미지 {i}]({img_filename})\n\n"
        else:
            images_section = "## 🖼️ 첨부 이미지 목록\n*첨부된 이미지가 없습니다.*\n"
            
        # 마크다운 내용 템플릿
        report = f"""# [게시글 수집 리포트] {title}

- **원본 게시글 링크**: {link}
- **카테고리**: {category}
- **작성자**: {author}
- **작성시간(발행일시)**: {pub_date}
- **수집 일시**: {datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")}

---

## 📝 게시글 본문 내용
```text
{content_text}
```

---

{images_section}

---

## 💬 베스트 댓글 (추천수 {like_threshold}개 이상)
{comments_section}
"""
        with open(filepath, "w", encoding="utf-8-sig") as f:
            f.write(report)
        print(f" -> [리포트 저장 완료] {filename_prefix}.md (베스트 댓글 {len(best_comments)}개, 이미지 {len(image_urls)}개 포함)")
    except Exception as e:
        print(f" -> [리포트 저장 실패] {e}", file=sys.stderr)

def fetch_and_parse_rss(seen_links, keywords, output_path, state_path, analysis_dir, like_threshold):
    """RSS 피드를 가져와 파싱하고 키워드 매칭된 새로운 게시글의 본문, 이미지, 댓글을 저장합니다."""
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    }
    
    print(f"[{datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] RSS 피드 수집 및 크롤링 진행 중...")
    
    try:
        response = requests.get(RSS_URL, headers=headers, timeout=15)
        response.raise_for_status()
        response.encoding = "utf-8"
        
        root = ET.fromstring(response.content)
        items = root.findall(".//item")
        
        new_matches_count = 0
        
        for item in reversed(items):
            title_el = item.find("title")
            link_el = item.find("link")
            pub_date_el = item.find("pubDate")
            author_el = item.find("author")
            category_el = item.find("category")
            
            title = title_el.text if title_el is not None else ""
            link = link_el.text if link_el is not None else ""
            pub_date = pub_date_el.text if pub_date_el is not None else ""
            author = author_el.text if author_el is not None else ""
            category = category_el.text if category_el is not None else ""
            
            if link in seen_links:
                continue
                
            # 키워드 매칭 검사
            matched = False
            for kw in keywords:
                if kw.lower() in title.lower():
                    matched = True
                    break
            
            if matched:
                seen_links.add(link)
                new_matches_count += 1
                
                print(f" -> [매칭 발견] [{category}] {title} (링크: {link})")
                
                # CSV 저장
                file_exists = os.path.exists(output_path)
                with open(output_path, "a", encoding="utf-8-sig", newline="") as f:
                    writer = csv.writer(f)
                    if not file_exists:
                        writer.writerow(["수집일시", "카테고리", "제목", "링크", "작성자", "작성시간"])
                    writer.writerow([
                        datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                        category,
                        title,
                        link,
                        author,
                        pub_date
                    ])
                
                # 본문, 베스트 댓글, 이미지 URL 크롤링
                content_text, best_comments, image_urls = scrape_post_and_comments(link, like_threshold)
                
                if not content_text:
                    content_text = "본문 내용을 추출하지 못했습니다."
                
                # 파일명 접두사 설정
                post_id_match = re.search(r"/read/(\d+)", link)
                post_id = post_id_match.group(1) if post_id_match else str(int(time.time()))
                date_str = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
                filename_prefix = f"report_{date_str}_{post_id}"
                
                # 1. 마크다운 리포트 파일 생성
                save_post_report(analysis_dir, filename_prefix, title, link, category, author, pub_date, content_text, best_comments, like_threshold, image_urls)
                
                # 2. 이미지 파일 다운로드
                if image_urls:
                    download_images(image_urls, analysis_dir, filename_prefix)
            else:
                seen_links.add(link)
        
        if new_matches_count > 0:
            print(f" -> 이번 주기에 {new_matches_count}개의 새로운 매칭 게시글을 처리했습니다.")
            save_state(state_path, seen_links)
        else:
            print(" -> 새로운 매칭 게시글이 없습니다.")
            
    except requests.exceptions.RequestException as e:
        print(f"[{datetime.datetime.now()}] 네트워크 연결 또는 HTTP 오류 발생: {e}", file=sys.stderr)
    except ET.ParseError as e:
        print(f"[{datetime.datetime.now()}] RSS XML 파싱 오류 발생: {e}", file=sys.stderr)
    except Exception as e:
        print(f"[{datetime.datetime.now()}] 수집 중 알 수 없는 오류 발생: {e}", file=sys.stderr)

def main():
    # .env 파일 값 로드
    load_env()
    
    # 아규먼트 파서 설정
    parser = argparse.ArgumentParser(description="루리웹 유머게시판 RSS 키워드 본문, 댓글 및 이미지 수집기")
    parser.add_argument("--keywords", type=str, help="수집할 키워드 목록 (쉼표로 구분)")
    parser.add_argument("--duration", type=float, help="수집 실행 시간 (시간 단위)")
    parser.add_argument("--interval", type=int, help="수집 주기 (초 단위)")
    parser.add_argument("--output", type=str, help="결과를 저장할 CSV 파일 경로")
    parser.add_argument("--analysis-dir", type=str, help="리포트를 저장할 디렉터리 경로")
    parser.add_argument("--likes", type=int, help="베스트 댓글 최소 추천수 기준")
    
    args = parser.parse_args()
    
    # 우선순위: 1) 명령줄 인자, 2) .env 환경변수, 3) 기본값
    keywords_str = args.keywords or os.environ.get("RSS_KEYWORDS", "버튜버,붉사,붉은사막")
    keywords = [k.strip() for k in keywords_str.split(",") if k.strip()]
    
    try:
        duration_hours = float(args.duration or os.environ.get("RSS_DURATION", 24))
    except ValueError:
        duration_hours = 24.0
        
    try:
        interval_seconds = int(args.interval or os.environ.get("RSS_INTERVAL", 300))
    except ValueError:
        interval_seconds = 300
        
    output_path = args.output or os.environ.get("RSS_OUTPUT_PATH", "collected_posts.csv")
    analysis_dir = args.analysis_dir or os.environ.get("RSS_ANALYSIS_DIR", "ruli-analysis")
    
    try:
        like_threshold = int(args.likes or os.environ.get("RSS_LIKE_THRESHOLD", 5))
    except ValueError:
        like_threshold = 5
        
    state_path = os.path.join(".tmp", "rss_state.json")
    
    print("=" * 60)
    print(" 루리웹 RSS 키워드 본문, 댓글 및 이미지 수집기 시작")
    print("-" * 60)
    print(f" 수집 대상: {RSS_URL}")
    print(f" 수집 키워드: {keywords}")
    print(f" 수집 실행 시간: {duration_hours} 시간")
    print(f" 수집 주기: {interval_seconds} 초")
    print(f" 결과 저장 CSV: {output_path}")
    print(f" 리포트 폴더: {analysis_dir}")
    print(f" 댓글 추천수 기준: {like_threshold}개 이상")
    print("=" * 60)
    
    seen_links = load_state(state_path)
    
    start_time = time.time()
    end_time = start_time + (duration_hours * 3600)
    
    try:
        while True:
            current_time = time.time()
            if current_time >= end_time:
                print(f"[{datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] 설정된 수집 시간({duration_hours}시간)이 완료되어 스크립트를 종료합니다.")
                break
                
            fetch_and_parse_rss(seen_links, keywords, output_path, state_path, analysis_dir, like_threshold)
            
            # 남은 시간 계산
            remaining_time = end_time - time.time()
            if remaining_time <= 0:
                break
                
            # 다음 폴링까지 대기 (남은 시간보다 길어지지 않게 조정)
            sleep_time = min(interval_seconds, int(remaining_time))
            if sleep_time > 0:
                print(f" -> 다음 수집까지 {sleep_time}초 대기합니다. (남은 시간: {int(remaining_time/60)}분)")
                time.sleep(sleep_time)
                
    except KeyboardInterrupt:
        print(f"\n[{datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] 사용자에 의해 수집기가 강제 중단되었습니다.")
    finally:
        save_state(state_path, seen_links)
        print(" 상태를 성공적으로 저장하고 수집기를 종료했습니다.")

if __name__ == "__main__":
    main()
