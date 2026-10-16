import { prisma } from '#lib/prisma.js';
import { decryptGitToken } from '../providers/gitCrypto.js';
import { getGitProvider } from '../providers/gitProviderFactory.js';
import type { GitRemoteRepoItem } from '../providers/IGitProvider.js';

export interface RemoteRepoWithMappingStatus extends GitRemoteRepoItem {
  isMapped: boolean;
  isMappedToCurrentProject: boolean;
  mappingId?: number;
  mappedProjectId?: number;
  mappedProjectKey?: string;
  mappedProjectName?: string;
}

interface ListRemoteRepositoriesParams {
  workspaceId: number;
  projectId?: number;
}

export async function listRemoteRepositoriesService(params: ListRemoteRepositoriesParams): Promise<RemoteRepoWithMappingStatus[]> {
  const { workspaceId, projectId } = params;

  const config = await prisma.gitPluginConfig.findUnique({
    where: { workspaceId },
  });

  if (!config || !config.isEnabled) {
    throw new Error('Git 플러그인이 비활성화 상태이거나 설정되지 않았습니다.');
  }

  const token = config.encryptedToken ? decryptGitToken(config.encryptedToken) : '';
  if (!token) {
    throw new Error('원격 저장소 목록 조회를 위한 Access Token이 등록되지 않았습니다.');
  }

  const gitProvider = getGitProvider(config.provider);
  const remoteRepos = await gitProvider.listRepositories(token, config.serverUrl || undefined);

  // 워크스페이스의 모든 매핑 조회
  const mappings = await prisma.gitRepositoryMapping.findMany({
    where: { pluginConfigId: config.id },
    include: {
      project: {
        select: { id: true, key: true, name: true },
      },
    },
  });

  const mappingMap = new Map<string, typeof mappings[0]>();
  for (const m of mappings) {
    mappingMap.set(m.repoIdentifier.toLowerCase(), m);
  }

  return remoteRepos.map((repo) => {
    const matched = mappingMap.get(repo.fullName.toLowerCase());
    const isMappedToCurrentProject = Boolean(matched && projectId && matched.projectId === projectId);

    return {
      ...repo,
      isMapped: Boolean(matched),
      isMappedToCurrentProject,
      mappingId: matched?.id,
      mappedProjectId: matched?.projectId,
      mappedProjectKey: matched?.project?.key,
      mappedProjectName: matched?.project?.name,
    };
  });
}
