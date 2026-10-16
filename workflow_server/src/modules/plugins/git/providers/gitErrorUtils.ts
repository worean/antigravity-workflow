/**
 * Git Provider 오류 응답 본문 요약 유틸
 *  - HTML 오류 페이지(예: GitLab 404 페이지)는 <title> 만 추출하고, JSON/텍스트는 앞부분만 잘라 반환합니다.
 */
export function summarizeErrorBody(body: string, maxLength = 200): string {
  if (!body) return '';
  const title = body.match(/<title>([\s\S]*?)<\/title>/i);
  if (title) return title[1].replace(/\s+/g, ' ').trim().slice(0, maxLength);
  return body.replace(/\s+/g, ' ').trim().slice(0, maxLength);
}
