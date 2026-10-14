import { prisma } from '#lib/prisma.js';

interface WebhookParams {
  workspaceId: number;
  headers: Record<string, string | string[] | undefined>;
  payload: any;
}

export async function handleGitWebhookService(params: WebhookParams) {
  const { workspaceId, headers, payload } = params;

  const config = await prisma.gitPluginConfig.findUnique({
    where: { workspaceId },
  });

  if (!config || !config.isEnabled) {
    return { success: false, message: 'Git 플러그인이 활성화되어 있지 않습니다.' };
  }

  // Provider 판별 및 서명 검증
  const isGitHub = headers['x-github-event'] !== undefined;
  const isGitLab = headers['x-gitlab-event'] !== undefined;
  const provider = isGitHub ? 'GITHUB' : isGitLab ? 'GITLAB' : config.provider;

  const gitlabToken = headers['x-gitlab-token'];
  if (isGitLab && config.webhookSecret && gitlabToken !== config.webhookSecret) {
    throw new Error('GitLab Webhook Secret 불일치');
  }

  const rawEvent = headers['x-github-event'] || headers['x-gitlab-event'] || payload?.object_kind || 'unknown';
  const eventType = Array.isArray(rawEvent) ? rawEvent[0] : String(rawEvent);

  // 저장소 식별자 추출
  const repoFullName =
    payload.repository?.full_name ||
    payload.project?.path_with_namespace ||
    payload.repository?.name ||
    '';

  // 감사 로그 기록
  const log = await prisma.gitWebhookLog.create({
    data: {
      workspaceId,
      provider,
      eventType,
      payload: payload as any,
      processed: false,
    },
  });

  // 해당 저장소 매핑 조회
  const repoMapping = await prisma.gitRepositoryMapping.findFirst({
    where: {
      pluginConfigId: config.id,
      repoIdentifier: repoFullName,
    },
    include: { project: true },
  });

  let processedCount = 0;

  // 1. Push 이벤트 처리 (커밋 바인딩)
  if (eventType === 'push' && repoMapping && Array.isArray(payload.commits)) {
    for (const commit of payload.commits) {
      const message = commit.message || '';
      const commitHash = commit.id || commit.hash;
      if (!commitHash) continue;

      // #123 또는 ISSUE-123 패턴 매칭
      const issueMatches = message.match(/#(\d+)/g);
      if (issueMatches) {
        for (const match of issueMatches) {
          const issueNum = parseInt(match.replace('#', ''), 10);
          const issue = await prisma.issue.findFirst({
            where: {
              projectId: repoMapping.projectId,
              issueNumber: issueNum,
            },
          });

          if (issue) {
            await prisma.gitCommitLink.upsert({
              where: {
                repoMappingId_commitHash_issueId: {
                  repoMappingId: repoMapping.id,
                  commitHash: commitHash.slice(0, 40),
                  issueId: issue.id,
                },
              },
              update: {
                message,
                authorName: commit.author?.name || 'Git Committer',
                authorEmail: commit.author?.email || null,
                committedAt: new Date(commit.timestamp || Date.now()),
              },
              create: {
                repoMappingId: repoMapping.id,
                issueId: issue.id,
                commitHash: commitHash.slice(0, 40),
                message,
                authorName: commit.author?.name || 'Git Committer',
                authorEmail: commit.author?.email || null,
                committedAt: new Date(commit.timestamp || Date.now()),
              },
            });
            processedCount++;
          }
        }
      }
    }
  }

  // 2. PR / MR 이벤트 처리
  const isPrEvent = eventType === 'pull_request' || eventType === 'Merge Request Hook' || payload.object_kind === 'merge_request';
  if (isPrEvent && repoMapping) {
    const prData = payload.pull_request || payload.object_attributes;
    if (prData) {
      const prNumber = prData.number || prData.iid;
      const title = prData.title || '';
      const body = prData.body || prData.description || '';
      const sourceBranch = prData.head?.ref || prData.source_branch || '';
      const targetBranch = prData.base?.ref || prData.target_branch || '';
      const authorName = prData.user?.login || prData.author?.username || 'Git User';
      const url = prData.html_url || prData.url || '';

      let state: string = 'OPEN';
      if (prData.merged || prData.state === 'merged') state = 'MERGED';
      else if (prData.state === 'closed') state = 'CLOSED';

      // 연관 일감 번호 추출
      let linkedIssueId: number | null = null;
      const combinedText = `${title} ${body}`;
      const match = combinedText.match(/#(\d+)/);
      if (match) {
        const issueNum = parseInt(match[1], 10);
        const issue = await prisma.issue.findFirst({
          where: {
            projectId: repoMapping.projectId,
            issueNumber: issueNum,
          },
        });
        if (issue) {
          linkedIssueId = issue.id;
        }
      }

      await prisma.gitPullRequest.upsert({
        where: {
          repoMappingId_prNumber: {
            repoMappingId: repoMapping.id,
            prNumber,
          },
        },
        update: {
          title,
          sourceBranch,
          targetBranch,
          state,
          url,
          ...(linkedIssueId ? { issueId: linkedIssueId } : {}),
        },
        create: {
          repoMappingId: repoMapping.id,
          issueId: linkedIssueId,
          prNumber,
          title,
          sourceBranch,
          targetBranch,
          state,
          authorName,
          url,
        },
      });

      // 자동 일감 완료 (Auto-close on Merge)
      if (state === 'MERGED' && config.autoCloseIssueOnMerge && linkedIssueId) {
        const doneStatus = await prisma.issueStatus.findFirst({
          where: { category: 'DONE' },
        });

        if (doneStatus) {
          await prisma.issue.update({
            where: { id: linkedIssueId },
            data: { statusId: doneStatus.id },
          });

          await prisma.issueHistory.create({
            data: {
              issueId: linkedIssueId,
              userId: 1,
              field: 'status',
              oldValue: 'IN_PROGRESS',
              newValue: doneStatus.name,
            },
          });
        }
      }
      processedCount++;
    }
  }

  // 로그 상태 갱신
  await prisma.gitWebhookLog.update({
    where: { id: log.id },
    data: { processed: true },
  });

  return { success: true, eventType, processedCount };
}
