import { prisma } from '#lib/prisma.js';
import { getGitProvider } from '../providers/gitProviderFactory.js';
import { decryptGitToken } from '../providers/gitCrypto.js';

interface TestGitConnectionParams {
  workspaceId?: number;
  provider: string;
  token?: string;
  serverUrl?: string;
}

export async function testGitConnectionService(params: TestGitConnectionParams) {
  const { workspaceId, provider, token, serverUrl } = params;
  let targetToken = token ? token.trim() : '';

  // 토큰이 '__SAVED_TOKEN__'이거나 마스킹된 경우, 저장된 DB 토큰을 복호화하여 사용
  if ((targetToken === '__SAVED_TOKEN__' || targetToken.includes('************')) && workspaceId) {
    const config = await prisma.gitPluginConfig.findUnique({
      where: { workspaceId },
    });
    if (config?.encryptedToken) {
      targetToken = decryptGitToken(config.encryptedToken);
    }
  }

  if (!targetToken) {
    return { success: false, message: 'Access Token이 입력되지 않았습니다.' };
  }

  const gitProvider = getGitProvider(provider);
  const result = await gitProvider.verifyToken(targetToken, serverUrl);

  if (result.valid) {
    return {
      success: true,
      message: `${provider} 인증 성공! (연결된 계정: ${result.username})`,
      username: result.username,
    };
  } else {
    return {
      success: false,
      message: result.error || '인증에 실패하였습니다.',
    };
  }
}
