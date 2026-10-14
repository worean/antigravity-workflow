﻿import { getGitProvider } from '../providers/gitProviderFactory.js';

interface TestGitConnectionParams {
  provider: string;
  token: string;
  serverUrl?: string;
}

export async function testGitConnectionService(params: TestGitConnectionParams) {
  const { provider, token, serverUrl } = params;
  if (!token || token.trim() === '') {
    return { success: false, message: 'Access Token이 입력되지 않았습니다.' };
  }

  const gitProvider = getGitProvider(provider);
  const result = await gitProvider.verifyToken(token.trim(), serverUrl);

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
