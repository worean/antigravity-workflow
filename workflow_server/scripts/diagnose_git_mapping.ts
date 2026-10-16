/**
 * Git 매핑 커밋/로그 조회 진단 스크립트
 *  - DB 의 Git 플러그인 설정 및 저장소 매핑을 읽고, 각 매핑에 대해 실제 Provider API 로 커밋 로그 조회를 시도합니다.
 *  - Provider 구현(listCommits)은 오류를 삼키고 [] 를 반환하므로, 여기서는 raw fetch 로 HTTP 상태/본문을 그대로 출력합니다.
 *  - 토큰 값은 출력하지 않습니다.
 *
 * 사용: npx tsx scripts/diagnose_git_mapping.ts
 */
import { prisma } from '#lib/prisma.js';
import { decryptGitToken } from '../src/modules/plugins/git/providers/gitCrypto.js';

const mask = (s: string) => (s.length <= 8 ? '****' : `${s.slice(0, 4)}...${s.slice(-4)}`);

async function main() {
  const configs = await prisma.gitPluginConfig.findMany({
    include: { repositories: { include: { project: { select: { id: true, key: true, name: true } } } } },
  } as any);

  if (configs.length === 0) {
    console.log('[진단] GitPluginConfig 레코드가 없습니다. (플러그인 설정/토큰 미저장)');
    return;
  }

  for (const config of configs as any[]) {
    console.log('='.repeat(70));
    console.log(`[설정] workspaceId=${config.workspaceId} provider=${config.provider} enabled=${config.isEnabled} serverUrl=${config.serverUrl || '(기본)'}`);
    console.log(`[설정] 토큰 저장 여부: ${config.encryptedToken ? 'YES' : 'NO'}`);

    let token = '';
    if (config.encryptedToken) {
      try {
        token = decryptGitToken(config.encryptedToken);
        console.log(`[설정] 토큰 복호화: 성공 (${mask(token)}, 길이 ${token.length})`);
      } catch (e: any) {
        console.log(`[설정] 토큰 복호화: 실패 -> ${e.message}  (ENCRYPTION 키 변경/데이터 손상 가능)`);
      }
    }

    const mappings = config.repositories || [];
    console.log(`[매핑] ${mappings.length}건`);

    for (const m of mappings) {
      console.log('-'.repeat(70));
      console.log(`[매핑 #${m.id}] project=${m.project?.key} repo="${m.repoIdentifier}" branch="${m.defaultBranch}" active=${m.isActive}`);
      if (!token) {
        console.log('  -> 토큰이 없어 조회 불가');
        continue;
      }

      const isGithub = config.provider === 'GITHUB';
      const repo = String(m.repoIdentifier).trim();
      let url: string;
      let headers: Record<string, string>;
      if (isGithub) {
        const base = config.serverUrl?.trim() ? config.serverUrl.replace(/\/$/, '') : 'https://api.github.com';
        url = `${base}/repos/${repo}/commits?sha=${encodeURIComponent(m.defaultBranch)}&per_page=5`;
        headers = { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github.v3+json', 'User-Agent': 'AntiGravity-Workflow' };
      } else {
        const raw = config.serverUrl?.trim() ? config.serverUrl.replace(/\/$/, '') : 'https://gitlab.com';
        const base = raw.endsWith('/api/v4') ? raw : `${raw}/api/v4`;
        url = `${base}/projects/${encodeURIComponent(repo)}/repository/commits?ref_name=${encodeURIComponent(m.defaultBranch)}&per_page=5`;
        headers = { 'PRIVATE-TOKEN': token };
      }

      console.log(`  요청: GET ${url}`);
      try {
        const res = await fetch(url, { headers });
        const text = await res.text();
        console.log(`  응답: HTTP ${res.status} ${res.statusText}`);
        if (!res.ok) {
          console.log(`  본문: ${text.slice(0, 300)}`);
          continue;
        }
        const data = JSON.parse(text) as any[];
        console.log(`  결과: 커밋 ${data.length}건 (최대 5건 요청)`);
        data.slice(0, 5).forEach((c) => {
          const hash = (c.sha || c.id || '').slice(0, 7);
          const msg = (c.commit?.message || c.title || c.message || '').split('\n')[0];
          console.log(`   - ${hash} ${msg}`);
        });
      } catch (e: any) {
        console.log(`  네트워크 오류: ${e.message} ${e.cause?.code ? `(${e.cause.code})` : ''}`);
      }
    }
  }
}

main()
  .catch((e) => {
    console.error('[진단 실패]', e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
